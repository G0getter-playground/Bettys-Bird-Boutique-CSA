/**
 * Streaming chat bridge.
 *
 * POST { userId, sessionId?, message } -> ReadableStream of newline-delimited
 * JSON UiEvent objects (NDJSON over SSE-like response).
 *
 * If sessionId is omitted, a new ADK session is created and the first event
 * emitted is { type: "session", sessionId }.
 */
import { NextRequest } from "next/server";
import {
  createSession,
  streamRun,
  type UiEvent,
} from "@/lib/adk-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { userId?: string; sessionId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid json" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = body.userId?.trim();
  const message = body.message?.trim();
  if (!userId || !message) {
    return new Response(
      JSON.stringify({ error: "userId and message required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: UiEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
      };

      try {
        let sessionId = body.sessionId;
        if (!sessionId) {
          sessionId = await createSession(userId);
          send({ type: "session", sessionId });
        }
        for await (const ev of streamRun({ sessionId, userId, message })) {
          send(ev);
        }
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "unknown bridge error";
        send({ type: "error", message });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
