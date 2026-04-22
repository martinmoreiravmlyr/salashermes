export type AppTheme = "dark" | "light";

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return value === "light" || value == "dark" ? value : "dark";
}

export function getSystemTheme(prefersDark: boolean): AppTheme {
  return prefersDark ? "dark" : "light";
}
