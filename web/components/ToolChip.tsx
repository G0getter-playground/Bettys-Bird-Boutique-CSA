"use client";

/**
 * A tiny pill that visualizes a tool call lifecycle:
 *  pending  -> "Searching store docs..."  with breathing dot
 *  done     -> "Found in store docs"      with check mark
 *  error    -> "Could not fetch"          with subdued red
 *
 * Maps ADK tool names to human-readable labels.
 */
import { useMemo } from "react";

export type ToolStatus = "pending" | "done" | "error";

export interface ToolEvent {
  id: string;
  name: string;
  status: ToolStatus;
  args?: Record<string, unknown>;
}

const TOOL_LABELS: Record<
  string,
  { running: string; done: string; icon: "db" | "doc" | "web" }
> = {
  "get-product-price": {
    running: "Checking product prices",
    done: "Price found",
    icon: "db",
  },
  search_datastore: {
    running: "Searching store documents",
    done: "Found in store docs",
    icon: "doc",
  },
  bird_knowledge_search: {
    running: "Searching the web for bird care",
    done: "Web research complete",
    icon: "web",
  },
  google_search: {
    running: "Searching the web",
    done: "Web research complete",
    icon: "web",
  },
};

function ToolIcon({ kind }: { kind: "db" | "doc" | "web" }) {
  const stroke = "currentColor";
  if (kind === "db")
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="8" cy="3.5" rx="5.5" ry="2" stroke={stroke} strokeWidth="1.3" />
        <path d="M2.5 3.5v9c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2v-9" stroke={stroke} strokeWidth="1.3" />
        <path d="M2.5 8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2" stroke={stroke} strokeWidth="1.3" />
      </svg>
    );
  if (kind === "doc")
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5l-3.5-3.5Z" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M9.5 1.5V5h3.5" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.5 8.5h5M5.5 11h3.5" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke={stroke} strokeWidth="1.3" />
      <ellipse cx="8" cy="8" rx="2.5" ry="6" stroke={stroke} strokeWidth="1.3" />
      <path d="M2 8h12" stroke={stroke} strokeWidth="1.3" />
    </svg>
  );
}

export function ToolChip({ event }: { event: ToolEvent }) {
  const cfg = useMemo(
    () =>
      TOOL_LABELS[event.name] ?? {
        running: `Running ${event.name}`,
        done: `${event.name} complete`,
        icon: "db" as const,
      },
    [event.name]
  );

  const isPending = event.status === "pending";
  const isError = event.status === "error";
  const label = isPending ? cfg.running : isError ? "Couldn't complete that lookup" : cfg.done;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${label}${isPending ? ", in progress" : ""}`}
      data-testid="tool-chip"
      data-tool-name={event.name}
      data-tool-status={event.status}
      className={[
        "animate-slide-in-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium",
        "border transition-colors duration-300",
        isPending
          ? "bg-[var(--background-elev)] text-[var(--muted)] border-[var(--border)]"
          : isError
          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900"
          : "bg-[var(--accent-soft)] text-[var(--bird-color)] border-transparent",
      ].join(" ")}
    >
      <span className="opacity-80">
        <ToolIcon kind={cfg.icon} />
      </span>
      <span>{label}</span>
      {isPending && (
        <span className="ml-0.5 flex h-3 items-end gap-0.5">
          <span className="h-1 w-1 rounded-full bg-current animate-dot-1" />
          <span className="h-1 w-1 rounded-full bg-current animate-dot-2" />
          <span className="h-1 w-1 rounded-full bg-current animate-dot-3" />
        </span>
      )}
      {event.status === "done" && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="ml-0.5"
        >
          <path
            d="M3.5 8.5l3 3 6-7"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
