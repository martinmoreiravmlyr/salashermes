import { describe, expect, it } from "vitest";
import { agentBookingRequestSchema, agentBookingsQuerySchema } from "@/lib/agent-booking-api";

describe("agent booking api schema", () => {
  it("normalizes a valid booking payload", () => {
    expect(
      agentBookingRequestSchema.parse({
        roomId: "atlas",
        date: "2026-05-05",
        start: "10:00",
        end: "11:00",
        title: "Planning",
        requester: "Ana@Empresa.com",
        participants: " rrhh@empresa.com ; lider@empresa.com ",
        reason: "Weekly sync",
        requiresApproval: "true",
      }),
    ).toEqual({
      roomId: "atlas",
      date: "2026-05-05",
      start: "10:00",
      end: "11:00",
      title: "Planning",
      requester: "ana@empresa.com",
      participants: ["rrhh@empresa.com", "lider@empresa.com"],
      reason: "Weekly sync",
      requiresApproval: true,
    });
  });

  it("accepts booking queries with requester email and filters", () => {
    expect(
      agentBookingsQuerySchema.parse({
        requesterEmail: "Ana@Empresa.com",
        week: "2026-05-05",
        capacityMin: "8",
        resourceType: "box",
      }),
    ).toEqual({
      requesterEmail: "ana@empresa.com",
      week: "2026-05-05",
      capacityMin: 8,
      resourceType: "box",
    });
  });
});
