"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)]"
      aria-label="Cambiar entre modo día y noche"
    >
      <span className="text-base">{isDark ? "☾" : "☀"}</span>
      <span>{isDark ? "Modo noche" : "Modo día"}</span>
    </button>
  );
}
