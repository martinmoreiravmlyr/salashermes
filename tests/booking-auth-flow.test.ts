import { describe, expect, it } from "vitest";
import { normalizeBookingFormForActor, normalizeCancelBookingForActor } from "@/lib/booking-auth-flow";

describe("booking auth flow", () => {
  it("uses the authenticated user as requester instead of trusting a spoofed form field", () => {
    expect(
      normalizeBookingFormForActor(
        {
          roomId: "delta",
          date: "2026-04-24",
          start: "09:00",
          end: "10:00",
          title: "Entrevista final",
          requester: "malicioso@empresa.com",
          participants: " rrhh@empresa.com ; lider@empresa.com ",
          reason: "Hiring loop",
          requiresApproval: "on",
        },
        { email: "ana@empresa.com", name: "Ana", role: "USER", isAdmin: false },
      ),
    ).toEqual({
      roomId: "delta",
      date: "2026-04-24",
      start: "09:00",
      end: "10:00",
      title: "Entrevista final",
      requester: "ana@empresa.com",
      participants: ["rrhh@empresa.com", "lider@empresa.com"],
      reason: "Hiring loop",
      requiresApproval: true,
    });
  });

  it("uses the authenticated actor for cancellation even if the form tries another email", () => {
    expect(
      normalizeCancelBookingForActor(
        {
          bookingId: "booking-1",
          actorEmail: "otro@empresa.com",
          isAdmin: "false",
        },
        { email: "admin@empresa.com", name: "Admin", role: "ADMIN", isAdmin: true },
      ),
    ).toEqual({
      bookingId: "booking-1",
      actorEmail: "admin@empresa.com",
      isAdmin: true,
    });
  });
});
