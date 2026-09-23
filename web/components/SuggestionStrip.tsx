"use client";

import { useState } from "react";

interface Props {
  suggestions: string[];
  onPick: (s: string) => void;
  hidden?: boolean;
}

/**
 * Persistent suggestion chip strip rendered above the composer.
 * - Stays accessible across the whole session.
 * - Hides (via CSS) while the agent is streaming a response.
 * - On click, animates the chosen chip out so the user sees attribution.
 */
export function SuggestionStrip({ suggestions, onPick, hidden }: Props) {
  const [exiting, setExiting] = useState<string | null>(null);

  const handlePick = (s: string) => {
    setExiting(s);
    // Fire send immediately, but let the animation finish before clearing.
    onPick(s);
    window.setTimeout(() => setExiting(null), 320);
  };

  return (
    <div
      role="group"
      aria-label="Suggested questions"
      data-testid="suggestion-strip"
      className={[
        "flex flex-wrap gap-2 transition-opacity duration-200",
        hidden
          ? "pointer-events-none max-h-0 overflow-hidden opacity-0"
          : "opacity-100",
      ].join(" ")}
      aria-hidden={hidden ? "true" : undefined}
    >
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          data-testid="suggestion"
          aria-label={`Suggested question: ${s}`}
          onClick={() => handlePick(s)}
          disabled={exiting === s}
          className={[
            "rounded-full border border-[var(--border-strong)] bg-[var(--background-elev)] px-3 py-1 text-[12.5px] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-colors",
            "hover:bg-[var(--accent-soft)] hover:text-[#7a5a35] dark:hover:text-[#e8d4b8] hover:border-transparent",
            exiting === s ? "animate-chip-fly-out" : "",
          ].join(" ")}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
