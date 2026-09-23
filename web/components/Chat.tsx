"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Message, type ChatMessage } from "./Message";
import { BirdMascot } from "./BirdMascot";
import { ThemeToggle } from "./ThemeToggle";
import { SuggestionStrip } from "./SuggestionStrip";
import type { ToolEvent } from "./ToolChip";

type StreamEvent =
  | { type: "session"; sessionId: string }
  | { type: "tool_call"; id: string; name: string; args: Record<string, unknown> }
  | { type: "tool_response"; id: string; name: string; result: string }
  | { type: "text_delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

const SUGGESTIONS = [
  "How much is a bird feeder?",
  "What are your store hours?",
  "What do parakeets eat?",
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/** Detect an empty / non-actionable tool response so we can render an error chip. */
function isFailedToolResult(result: string): boolean {
  if (!result) return true;
  const trimmed = result.trim();
  if (!trimmed) return true;
  if (/^(null|undefined|none)$/i.test(trimmed)) return true;
  if (/error|unavailable|connection\s*refused|timeout|failed/i.test(trimmed)) return true;
  return false;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState(
    () => `web-${Math.random().toString(36).slice(2, 10)}`
  );
  const sessionIdRef = useRef<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Auto-scroll only if the user is near the bottom; pause if they've scrolled up.
  const stickToBottomRef = useRef(true);

  // Auto-scroll on new messages (only when user hasn't scrolled away).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Track if the user has scrolled up; if so, pause auto-scroll.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = dist < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const updateAgentMessage = useCallback(
    (id: string, patch: (m: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)));
    },
    []
  );

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || busy) return;

      const userMsg: ChatMessage = {
        id: makeId("u"),
        role: "user",
        text,
        createdAt: Date.now(),
      };
      const agentMsgId = makeId("a");
      const agentMsg: ChatMessage = {
        id: agentMsgId,
        role: "agent",
        text: "",
        tools: [],
        pending: true,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      setInput("");
      setBusy(true);
      setError(null);
      stickToBottomRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            sessionId: sessionIdRef.current ?? undefined,
            message: text,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Server responded ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line) continue;
            let ev: StreamEvent;
            try {
              ev = JSON.parse(line) as StreamEvent;
            } catch {
              continue;
            }
            handleEvent(ev, agentMsgId);
          }
        }
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") {
          updateAgentMessage(agentMsgId, (m) => ({
            ...m,
            pending: false,
            text: m.text || "(cancelled)",
          }));
        } else {
          const msg = e instanceof Error ? e.message : "unknown error";
          setError(msg);
          updateAgentMessage(agentMsgId, (m) => ({
            ...m,
            pending: false,
            text:
              m.text ||
              "Something went sideways on my end. Please try again in a moment.",
          }));
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
        // Return focus to the composer for fast follow-ups.
        inputRef.current?.focus();
      }
    },
    [busy, userId, updateAgentMessage]
  );

  const handleEvent = useCallback(
    (ev: StreamEvent, agentMsgId: string) => {
      switch (ev.type) {
        case "session":
          sessionIdRef.current = ev.sessionId;
          break;
        case "tool_call": {
          const tool: ToolEvent = {
            id: ev.id,
            name: ev.name,
            status: "pending",
            args: ev.args,
          };
          updateAgentMessage(agentMsgId, (m) => ({
            ...m,
            tools: [...(m.tools ?? []), tool],
          }));
          break;
        }
        case "tool_response": {
          const failed = isFailedToolResult(ev.result);
          updateAgentMessage(agentMsgId, (m) => ({
            ...m,
            tools: (m.tools ?? []).map((t) =>
              t.id === ev.id || t.name === ev.name
                ? { ...t, status: failed ? ("error" as const) : ("done" as const) }
                : t
            ),
          }));
          break;
        }
        case "text_delta":
          updateAgentMessage(agentMsgId, (m) => ({
            ...m,
            pending: false,
            text: m.text + ev.text,
          }));
          break;
        case "error":
          setError(ev.message);
          updateAgentMessage(agentMsgId, (m) => ({
            ...m,
            pending: false,
            tools: (m.tools ?? []).map((t) =>
              t.status === "pending" ? { ...t, status: "error" as const } : t
            ),
          }));
          break;
        case "done":
          updateAgentMessage(agentMsgId, (m) => ({ ...m, pending: false }));
          break;
      }
    },
    [updateAgentMessage]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    } else if (e.key === "Escape" && busy) {
      // Cancel in-flight stream.
      e.preventDefault();
      abortRef.current?.abort();
    }
  };

  const onRetry = () => {
    setError(null);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) void send(lastUser.text);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header — full-bleed bar with content centered within */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]"
          >
            <BirdMascot size={22} />
          </div>
          <div className="leading-tight min-w-0">
            <h1 className="text-[15px] font-semibold tracking-[-0.01em] truncate">
              Betty&apos;s Bird Brain
            </h1>
            <p className="text-[12px] text-[var(--muted)] truncate">
              Customer service for Betty&apos;s Bird Boutique
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Decorative brand dot — no "Online" label since status is not live. */}
          <span
            aria-hidden="true"
            className="relative inline-flex h-2 w-2"
            title="Betty's Bird Brain"
          >
            <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-breathe" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <ThemeToggle />
        </div>
        </div>
      </header>

      {/* Messages — full-bleed scroll area, content centered with a reading-friendly cap */}
      <main
        id="main"
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-10 py-6"
        aria-live="polite"
        aria-label="Conversation"
      >
        <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4">
          {isEmpty ? (
            <EmptyState />
          ) : (
            messages.map((m) => <Message key={m.id} msg={m} />)
          )}
        </div>
      </main>

      {/* Composer — full-bleed footer, content centered to match thread width */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md px-4 sm:px-8 lg:px-10 py-4">
        <div className="mx-auto w-full max-w-[860px] space-y-3">
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              <span>Network hiccup — &ldquo;{error}&rdquo;</span>
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md border border-red-300 px-2 py-0.5 text-[12px] font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
              >
                Retry
              </button>
            </div>
          )}

          {/* Persistent suggestions — hidden while the agent is responding. */}
          <SuggestionStrip
            suggestions={SUGGESTIONS}
            onPick={(s) => void send(s)}
            hidden={busy}
          />

          <form onSubmit={onSubmit} className="relative flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <div
              className={[
                "flex w-full items-end rounded-[22px] border bg-[var(--background-elev)] shadow-[var(--shadow-md)] transition-all",
                "border-[var(--border-strong)] focus-within:border-[var(--accent)]",
                !busy && input.length === 0 ? "animate-pulse-glow" : "",
              ].join(" ")}
            >
              <textarea
                id="chat-input"
                data-testid="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask about a price, store hours, or bird care…"
                aria-label="Type your message"
                className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-[var(--muted-light)] [field-sizing:content] max-h-40"
                disabled={busy}
              />
              <button
                type="submit"
                data-testid="send-button"
                disabled={busy || input.trim().length === 0}
                aria-label={busy ? "Press Escape to cancel" : "Send message"}
                className="m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-transform disabled:opacity-30 enabled:hover:scale-[1.04] enabled:active:scale-95"
              >
                {busy ? (
                  <span className="inline-flex gap-0.5" aria-hidden="true">
                    <span className="h-1 w-1 rounded-full bg-current animate-dot-1" />
                    <span className="h-1 w-1 rounded-full bg-current animate-dot-2" />
                    <span className="h-1 w-1 rounded-full bg-current animate-dot-3" />
                  </span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>
          <p className="text-center text-[11px] text-[var(--muted-light)]">
            {busy
              ? "Press Esc to cancel · Shift+Enter for a new line"
              : "Press Enter to send · Shift+Enter for a new line"}
          </p>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center gap-5 pt-10 sm:pt-16">
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]"
      >
        <BirdMascot size={40} />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
          Hi, I&apos;m Betty&apos;s Bird Brain.
        </h2>
        <p className="text-[14px] text-[var(--muted)]">
          I can look up product prices, share what&apos;s happening at the
          boutique, and answer your bird-care questions.
        </p>
        <p className="text-[12px] text-[var(--muted-light)] pt-2">
          Tap a suggestion below, or type your own question.
        </p>
      </div>
    </div>
  );
}
