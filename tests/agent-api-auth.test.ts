import { describe, expect, it } from "vitest";
import { isAgentApiEnabled, resolveAgentActor } from "@/lib/agent-api-auth";

describe("agent api auth", () => {
  it("detects when the agent API token is configured", () => {
    expect(isAgentApiEnabled({ TELEGRAM_AGENT_API_TOKEN: "secret" } as NodeJS.ProcessEnv)).toBe(true);
    expect(isAgentApiEnabled({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("builds an admin actor from a valid bearer token", () => {
    const request = new Request("http://localhost/api/agent/bookings", {
      headers: { authorization: "Bearer top-secret" },
    });

    expect(
      resolveAgentActor(request, {
        TELEGRAM_AGENT_API_TOKEN: "top-secret",
        TELEGRAM_AGENT_EMAIL: "ReservasBot@empresa.com",
        TELEGRAM_AGENT_NAME: "Reservas Bot",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      email: "reservasbot@empresa.com",
      name: "Reservas Bot",
      role: "ADMIN",
      isAdmin: true,
    });
  });

  it("rejects missing or invalid tokens", () => {
    const request = new Request("http://localhost/api/agent/bookings");

    expect(() =>
      resolveAgentActor(request, {
        TELEGRAM_AGENT_API_TOKEN: "top-secret",
      } as NodeJS.ProcessEnv),
    ).toThrow(/token/i);
  });
});
