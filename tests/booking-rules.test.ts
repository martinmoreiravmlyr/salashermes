import { describe, expect, it } from "vitest";
import {
  areIntervalsOverlapping,
  bookingVisualState,
  canCancelBooking,
  isSlotAllowed,
} from "@/lib/booking-rules";

describe("booking rules", () => {
  it("detects overlapping intervals", () => {
    expect(
      areIntervalsOverlapping(
        new Date("2026-04-22T10:00:00.000Z"),
        new Date("2026-04-22T11:00:00.000Z"),
        new Date("2026-04-22T10:30:00.000Z"),
        new Date("2026-04-22T11:30:00.000Z"),
      ),
    ).toBe(true);
  });

  it("allows touching intervals without overlap", () => {
    expect(
      areIntervalsOverlapping(
        new Date("2026-04-22T10:00:00.000Z"),
        new Date("2026-04-22T11:00:00.000Z"),
        new Date("2026-04-22T11:00:00.000Z"),
        new Date("2026-04-22T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("rejects slots outside configured hours or too long", () => {
    expect(
      isSlotAllowed({
        start: new Date("2026-04-22T07:30:00.000Z"),
        end: new Date("2026-04-22T09:00:00.000Z"),
        allowedStartHour: 8,
        allowedEndHour: 20,
        maxDurationMinutes: 120,
        blockedDates: [],
      }).allowed,
    ).toBe(false);

    expect(
      isSlotAllowed({
        start: new Date("2026-04-22T10:00:00.000Z"),
        end: new Date("2026-04-22T13:30:00.000Z"),
        allowedStartHour: 8,
        allowedEndHour: 20,
        maxDurationMinutes: 120,
        blockedDates: [],
      }).reason,
    ).toContain("duración");
  });

  it("derives visual states for bookings", () => {
    const base = {
      isMine: false,
      isParticipant: false,
      isPast: false,
      requiresApproval: false,
      status: "CONFIRMED" as const,
      reservable: true,
      restricted: false,
    };

    expect(bookingVisualState({ ...base, isMine: true })).toBe("mi reserva");
    expect(bookingVisualState({ ...base, isParticipant: true })).toBe("participante");
    expect(bookingVisualState({ ...base, isPast: true })).toBe("pasado");
    expect(bookingVisualState({ ...base, status: "PENDING" })).toBe("pendiente");
    expect(bookingVisualState({ ...base, reservable: false })).toBe("no reservable");
    expect(bookingVisualState({ ...base, restricted: true })).toBe("restringido");
    expect(bookingVisualState(base)).toBe("reservado");
  });

  it("enforces cancellation permissions", () => {
    expect(canCancelBooking({ isAdmin: true, isOwner: false, status: "CONFIRMED" })).toBe(true);
    expect(canCancelBooking({ isAdmin: false, isOwner: true, status: "CONFIRMED" })).toBe(true);
    expect(canCancelBooking({ isAdmin: false, isOwner: false, status: "CONFIRMED" })).toBe(false);
    expect(canCancelBooking({ isAdmin: false, isOwner: true, status: "CANCELLED" })).toBe(false);
  });
});
