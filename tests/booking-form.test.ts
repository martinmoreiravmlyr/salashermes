import { describe, expect, it } from "vitest";
import {
  canManageBookingFromUi,
  normalizeBookingMutationInput,
  parseParticipantEmails,
} from "@/lib/booking-form";

describe("booking form helpers", () => {
  it("parses participant emails from commas, semicolons and new lines", () => {
    expect(parseParticipantEmails(` ana@empresa.com, bob@empresa.com;\n\ncarol@empresa.com `)).toEqual([
      "ana@empresa.com",
      "bob@empresa.com",
      "carol@empresa.com",
    ]);
  });

  it("normalizes create-booking form values into service input", () => {
    expect(
      normalizeBookingMutationInput({
        roomId: "delta",
        date: "2026-04-24",
        start: "09:00",
        end: "10:00",
        title: "Entrevista final",
        requester: "ana@empresa.com",
        participants: " rrhh@empresa.com ; lider@empresa.com ",
        reason: "Hiring loop",
        requiresApproval: "on",
      }),
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

  it("only enables cancel action for booking owners or admins when booking is active", () => {
    const booking = {
      id: "r2",
      roomId: "atlas",
      date: "2026-04-22",
      start: "08:00",
      end: "10:00",
      title: "Sprint planning",
      requester: "martin@empresa.com",
      participants: ["ana@empresa.com"],
      status: "CONFIRMED" as const,
    };

    expect(canManageBookingFromUi(booking, "martin@empresa.com")).toBe(true);
    expect(canManageBookingFromUi(booking, "admin@empresa.com", true)).toBe(true);
    expect(canManageBookingFromUi(booking, "ana@empresa.com")).toBe(false);
    expect(canManageBookingFromUi({ ...booking, status: "CANCELLED" }, "martin@empresa.com")).toBe(false);
  });
});
