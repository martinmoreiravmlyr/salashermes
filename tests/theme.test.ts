import { describe, expect, it } from "vitest";
import { getSystemTheme, normalizeTheme } from "@/lib/theme";

describe("theme helpers", () => {
  it("normalizes unknown values to dark", () => {
    expect(normalizeTheme(undefined)).toBe("dark");
    expect(normalizeTheme("other")).toBe("dark");
  });

  it("accepts light and dark values", () => {
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme("dark")).toBe("dark");
  });

  it("maps system preference to a valid theme", () => {
    expect(getSystemTheme(true)).toBe("dark");
    expect(getSystemTheme(false)).toBe("light");
  });
});
