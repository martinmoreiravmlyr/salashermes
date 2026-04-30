import { describe, expect, it } from "vitest";
import { createBookingService, createInMemoryRepository, type BookingRecord } from "@/lib/booking-service";
import { rooms } from "@/lib/schedule";

describe("cancelled booking visibility", () => {
  it("hides cancelled bookings from the room grid and my bookings", async () => {
    const cancelled: BookingRecord = {
      id: "cancelled-1",
      roomId: "atlas",
      date: "2026-04-22",
      start: "10:00",
      end: "11:00",
      title: "Reserva cancelada",
      requester: "ana@empresa.com",
      participants: ["rrhh@empresa.com"],
      status: "CANCELLED",
      cancelledAt: "2026-04-22T12:00:00.000Z",
      cancelledBy: "ana@empresa.com",
    };

    const service = createBookingService(
      createInMemoryRepository({
        rooms,
        bookings: [cancelled],
      }),
    );

    const snapshot = await service.getDashboardSnapshot({
      week: "2026-04-22",
      userEmail: "ana@empresa.com",
      filters: {},
    });

    expect(snapshot.bookings).toEqual([]);
    expect(snapshot.grouped.atlas?.["2026-04-22"]).toEqual([]);
    expect(snapshot.myBookings).toEqual([]);
    expect(snapshot.stats.reservations).toBe(0);
  });
});
