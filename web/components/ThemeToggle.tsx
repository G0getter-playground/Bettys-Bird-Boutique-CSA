"use client";

import { useEffect, useRef, useState } from "react";
import { Sun, Moon, MonitorCog } from "lucide-react";

export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "betty-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (theme === "light") root.classList.add("theme-light");
  else if (theme === "dark") root.classList.add("theme-dark");
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

const OPTIONS: Array<{ value: Theme; label: string; Icon: typeof Sun }> = [
  { value: "system", label: "System", Icon: MonitorCog },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setTheme(readStoredTheme());
  }, []);

  const change = (next: Theme) => {
    setTheme(next);
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = OPTIONS.findIndex((o) => o.value === theme);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = OPTIONS[(idx + 1) % OPTIONS.length];
      change(next.value);
      groupRef.current
        ?.querySelector<HTMLButtonElement>(`[data-theme="${next.value}"]`)
        ?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = OPTIONS[(idx - 1 + OPTIONS.length) % OPTIONS.length];
      change(prev.value);
      groupRef.current
        ?.querySelector<HTMLButtonElement>(`[data-theme="${prev.value}"]`)
        ?.focus();
    }
  };

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return (
      <div
        role="radiogroup"
        aria-label="Color theme"
        className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background-elev)] p-0.5"
      >
        {OPTIONS.map(({ value, label, Icon }) => (
          <span
            key={value}
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-light)] opacity-60"
            title={label}
          >
            <Icon size={14} strokeWidth={1.75} />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Color theme"
      onKeyDown={onKeyDown}
      data-testid="theme-toggle"
      className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background-elev)] p-0.5 shadow-[var(--shadow-sm)]"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const checked = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            title={label}
            tabIndex={checked ? 0 : -1}
            data-theme={value}
            data-testid={`theme-${value}`}
            onClick={() => change(value)}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
              checked
                ? "bg-[var(--accent-soft)] text-[var(--bird-color)]"
                : "text-[var(--muted-light)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
