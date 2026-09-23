"use client";

import { useState } from "react";
import { ToolChip, type ToolEvent } from "./ToolChip";
import { BirdMascot } from "./BirdMascot";
import { MarkdownContent } from "./MarkdownContent";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  tools?: ToolEvent[];
  createdAt: number;
  /** When true, render an animated thinking indicator instead of empty body. */
  pending?: boolean;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ThinkingDots() {
  return (
    <span
      className="inline-flex items-end gap-1 align-middle"
      aria-label="Assistant is thinking"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-light)] animate-dot-1" />
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-light)] animate-dot-2" />
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-light)] animate-dot-3" />
    </span>
  );
}

export function Message({ msg }: { msg: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const onCopy = async () => {
    const writeViaTextarea = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = msg.text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    };

    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(msg.text);
        ok = true;
      } catch {
        ok = writeViaTextarea();
      }
    } else {
      ok = writeViaTextarea();
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <div
      className={`animate-fade-in-up flex w-full gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
      data-testid={isUser ? "user-message" : "agent-message"}
    >
      {!isUser && (
        <div
          aria-hidden="true"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]"
        >
          <BirdMascot size={20} />
        </div>
      )}

      <div className={`flex max-w-[78%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && msg.tools && msg.tools.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {msg.tools.map((t) => (
              <ToolChip key={t.id} event={t} />
            ))}
          </div>
        )}

        <div
          className={[
            "group relative rounded-[var(--radius-bubble)] px-4 py-2.5 text-[15px] leading-[1.5]",
            "transition-shadow",
            isUser
              ? "bg-[var(--user-bubble)] text-[var(--background)] rounded-br-md shadow-[var(--shadow-sm)]"
              : "bg-[var(--agent-bubble)] text-[var(--foreground)] rounded-bl-md shadow-[var(--shadow-md)] border border-[var(--border)]",
          ].join(" ")}
        >
          {msg.pending && !msg.text ? <ThinkingDots /> : (
            isUser ? (
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
            ) : (
              <MarkdownContent text={msg.text} />
            )
          )}

          {!isUser && msg.text && !msg.pending && (
            <button
              type="button"
              onClick={onCopy}
              aria-label={copied ? "Copied" : "Copy message"}
              className="absolute -right-2 -bottom-2 hidden h-7 w-7 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--background-elev)] text-[var(--muted)] shadow-[var(--shadow-sm)] transition-opacity hover:text-[var(--foreground)] focus-visible:flex group-hover:flex"
            >
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="4.5" y="4.5" width="8" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <path d="M6.5 4.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
                </svg>
              )}
            </button>
          )}
        </div>

        <time
          dateTime={new Date(msg.createdAt).toISOString()}
          className="mt-1 px-1 text-[11px] text-[var(--muted-light)] opacity-0 transition-opacity group-hover:opacity-100"
          title={new Date(msg.createdAt).toLocaleString()}
        >
          {formatTime(msg.createdAt)}
        </time>
      </div>
    </div>
  );
}
