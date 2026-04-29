import { describe, expect, it } from "vitest";
import { getAuthAvailability } from "@/lib/auth-config";

describe("getAuthAvailability", () => {
  it("disables auth when NEXTAUTH_SECRET is missing even if Mongo exists", () => {
    expect(
      getAuthAvailability({
        MONGODB_URI: "mongodb://localhost:27017/salashermes",
      }),
    ).toEqual({ enabled: false, reason: "missing-secret" });
  });

  it("disables auth when Mongo is missing", () => {
    expect(
      getAuthAvailability({
        NEXTAUTH_SECRET: "secret",
      }),
    ).toEqual({ enabled: false, reason: "missing-mongodb" });
  });

  it("enables auth when both Mongo and secret are configured", () => {
    expect(
      getAuthAvailability({
        NEXTAUTH_SECRET: "secret",
        MONGODB_URI: "mongodb://localhost:27017/salashermes",
      }),
    ).toEqual({ enabled: true, reason: "configured" });
  });
});
