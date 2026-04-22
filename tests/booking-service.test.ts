import { describe, expect, it } from "vitest";
import { createDemoRepository, createBookingService } from "@/lib/booking-service";

describe("booking service", () => {
  it("lists bookings for a given week and current user", async () => {
    const service = createBookingService(createDemoRepository());

    const result = await service.getDashboardSnapshot({
      week: "2026-04-22",
      userEmail: "ana@empresa.com",
      filters: {},
    });

    expect(result.stats.rooms).toBe(8);
    expect(result.myBookings).toHaveLength(3);
    expect(result.weekDays[0]?.iso).toBe("2026-04-20");
  });

  it("creates a new booking when the slot is free", async () => {
    const repository = createDemoRepository();
    const service = createBookingService(repository);

    const created = await service.createBooking({
      roomId: "delta",
      date: "2026-04-24",
      start: "09:00",
      end: "10:00",
      title: "Entrevista final",
      requester: "ana@empresa.com",
      participants: ["rrhh@empresa.com"],
      reason: "Hiring loop",
      requiresApproval: true,
    });

    expect(created.status).toBe("PENDING");

    const bookings = await repository.listBookings();
    expect(bookings.some((booking) => booking.id === created.id)).toBe(true);
  });

  it("rejects overlapping bookings", async () => {
    const service = createBookingService(createDemoRepository());

    await expect(
      service.createBooking({
        roomId: "atlas",
        date: "2026-04-22",
        start: "12:30",
        end: "13:30",
        title: "Choque de agenda",
        requester: "ana@empresa.com",
        participants: [],
        reason: "Conflict test",
        requiresApproval: false,
      }),
    ).rejects.toThrow(/solapa/i);
  });

  it("cancels a booking only for the owner or an admin", async () => {
    const repository = createDemoRepository();
    const service = createBookingService(repository);

    await expect(
      service.cancelBooking({
        bookingId: "r2",
        actorEmail: "otro@empresa.com",
        isAdmin: false,
      }),
    ).rejects.toThrow(/permiso/i);

    const cancelled = await service.cancelBooking({
      bookingId: "r2",
      actorEmail: "martin@empresa.com",
      isAdmin: false,
    });

    expect(cancelled.status).toBe("CANCELLED");
  });
});
