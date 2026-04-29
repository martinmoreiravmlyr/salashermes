import { describe, expect, it } from "vitest";
import { registerUserRequestSchema } from "@/lib/register-api";

describe("register api schema", () => {
  it("accepts a valid registration payload", () => {
    expect(
      registerUserRequestSchema.parse({
        name: "Ana",
        email: "ana@empresa.com",
        password: "Sup3rSecret!",
      }),
    ).toEqual({
      name: "Ana",
      email: "ana@empresa.com",
      password: "Sup3rSecret!",
    });
  });

  it("rejects invalid payloads before hitting persistence", () => {
    expect(() =>
      registerUserRequestSchema.parse({
        name: "",
        email: "bad-email",
        password: "123",
      }),
    ).toThrow();
  });
});
