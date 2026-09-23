/**
 * ADK <-> Frontend protocol bridge.
 *
 * Speaks to Google ADK's FastAPI server (`adk api_server`):
 *   - POST /apps/{app}/users/{user}/sessions  -> create session
 *   - POST /run_sse  -> stream Event objects via Server-Sent Events
 *
 * Translates ADK Event stream into a simplified UI event stream:
 *   { type: "tool_call",     name, args }
 *   { type: "tool_response", name, result }
 *   { type: "text_delta",    text }
 *   { type: "done" }
 *   { type: "error",         message }
 *
 * Why custom-built instead of CopilotKit's runtime: ADK speaks its own
 * Event protocol (not AG-UI yet). CopilotKit's runtime expects a
 * LangGraph/OpenAI-shaped backend. A 200-line adapter is dramatically
 * simpler to maintain than a CopilotKit runtime shim.
 */

export const ADK_BASE_URL =
  process.env.ADK_BASE_URL || "http://127.0.0.1:8093";
export const ADK_APP_NAME = process.env.ADK_APP_NAME || "src";

export type UiEvent =
  | { type: "session"; sessionId: string }
  | { type: "tool_call"; id: string; name: string; args: Record<string, unknown> }
  | { type: "tool_response"; id: string; name: string; result: string }
  | { type: "text_delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function createSession(userId: string): Promise<string> {
  const res = await fetch(
    `${ADK_BASE_URL}/apps/${ADK_APP_NAME}/users/${encodeURIComponent(
      userId
    )}/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ADK createSession failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.id as string;
}

/**
 * Parse one SSE `data:` payload from ADK and yield UI events.
 * ADK emits one JSON envelope per `data:` line.
 */
function translateAdkEvent(adk: any): UiEvent[] {
  const out: UiEvent[] = [];
  const parts = adk?.content?.parts ?? [];
  for (const part of parts) {
    if (part.functionCall) {
      out.push({
        type: "tool_call",
        id: part.functionCall.id ?? `${Date.now()}`,
        name: part.functionCall.name,
        args: part.functionCall.args ?? {},
      });
    } else if (part.functionResponse) {
      const raw = part.functionResponse.response;
      const result =
        typeof raw === "string" ? raw : JSON.stringify(raw?.result ?? raw);
      out.push({
        type: "tool_response",
        id: part.functionResponse.id ?? `${Date.now()}`,
        name: part.functionResponse.name,
        result,
      });
    } else if (typeof part.text === "string" && part.text.length > 0) {
      out.push({ type: "text_delta", text: part.text });
    }
  }
  return out;
}

/**
 * POST a user message to ADK and stream UI events back as an async iterator.
 * Yields UiEvent objects until the stream ends.
 */
export async function* streamRun({
  sessionId,
  userId,
  message,
}: {
  sessionId: string;
  userId: string;
  message: string;
}): AsyncGenerator<UiEvent> {
  const res = await fetch(`${ADK_BASE_URL}/run_sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName: ADK_APP_NAME,
      userId,
      sessionId,
      newMessage: {
        role: "user",
        parts: [{ text: message }],
      },
      streaming: false,
    }),
  });

  if (!res.ok || !res.body) {
    const body = res.body ? await res.text() : "(no body)";
    yield { type: "error", message: `ADK run failed: ${res.status} ${body}` };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // Split on SSE event terminator (blank line)
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of block.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const adk = JSON.parse(payload);
            for (const ui of translateAdkEvent(adk)) yield ui;
          } catch (e) {
            // Skip malformed event; don't abort the stream.
            console.warn("[adk-adapter] failed to parse event:", e);
          }
        }
      }
    }
  } finally {
    yield { type: "done" };
    try {
      reader.releaseLock();
    } catch {}
  }
}
