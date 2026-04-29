import { describe, expect, it, vi } from "vitest";
import { createMongoRepository, mapMongoBooking, mapMongoRoom } from "@/lib/mongoose-repository";

describe("mongoose repository", () => {
  it("maps a Mongo room document to the UI room contract", () => {
    const room = mapMongoRoom({
      _id: "sala-6b",
      name: "SALA 6B",
      capacity: 8,
      location: "Piso 2 · Montevideo",
      owner: "Creatividad",
      type: "sala",
      equipment: ["TV", "Apple TV"],
      color: "bg-indigo-500",
      isReservable: true,
    });

    expect(room).toEqual({
      id: "sala-6b",
      name: "SALA 6B",
      capacity: 8,
      location: "Piso 2 · Montevideo",
      owner: "Creatividad",
      type: "sala",
      equipment: ["TV", "Apple TV"],
      color: "bg-indigo-500",
    });
  });

  it("maps a Mongo booking document to the service contract", () => {
    const booking = mapMongoBooking({
      _id: "booking-1",
      roomId: "sala-bo",
      date: "2026-04-24",
      start: "10:00",
      end: "12:30",
      title: "Comité dirección",
      requester: "direccion@empresa.com",
      participants: ["finance@empresa.com", "ana@empresa.com"],
      status: "CONFIRMED",
      restricted: true,
      reason: "Seguimiento mensual",
      createdAt: new Date("2026-04-20T12:00:00.000Z"),
      cancelledAt: null,
      cancelledBy: null,
    });

    expect(booking).toMatchObject({
      id: "booking-1",
      roomId: "sala-bo",
      date: "2026-04-24",
      start: "10:00",
      end: "12:30",
      title: "Comité dirección",
      requester: "direccion@empresa.com",
      participants: ["finance@empresa.com", "ana@empresa.com"],
      status: "CONFIRMED",
      restricted: true,
      reason: "Seguimiento mensual",
    });
    expect(booking.createdAt).toBe("2026-04-20T12:00:00.000Z");
  });

  it("seeds rooms and persists booking updates through the Mongo adapter contract", async () => {
    const state = {
      rooms: [] as Array<Record<string, unknown>>,
      bookings: [] as Array<Record<string, unknown>>,
    };

    const repository = createMongoRepository(
      vi.fn().mockResolvedValue({
        async ensureSeedRooms(seedRooms) {
          if (state.rooms.length === 0) {
            state.rooms = seedRooms.map((room) => ({ ...room }));
          }
        },
        async listRooms() {
          return state.rooms;
        },
        async listBookings() {
          return state.bookings;
        },
        async createBooking(booking) {
          state.bookings.push({ ...booking, createdAt: new Date("2026-04-20T12:00:00.000Z") });
          return state.bookings.at(-1);
        },
        async updateBooking(bookingId, updater) {
          const index = state.bookings.findIndex((booking) => booking._id === bookingId);
          if (index === -1) return null;
          const next = updater(state.bookings[index]);
          state.bookings[index] = { ...next };
          return state.bookings[index];
        },
      }),
    );

    const rooms = await repository.listRooms();
    expect(rooms.some((room) => room.id === "atlas")).toBe(true);

    const created = await repository.createBooking({
      id: "booking-2",
      roomId: "atlas",
      date: "2026-04-24",
      start: "09:00",
      end: "10:00",
      title: "Entrevista final",
      requester: "ana@empresa.com",
      participants: ["rrhh@empresa.com"],
      reason: "Hiring loop",
      status: "PENDING",
    });

    expect(created.createdAt).toBe("2026-04-20T12:00:00.000Z");

    const cancelled = await repository.updateBooking("booking-2", (current) => ({
      ...current,
      status: "CANCELLED",
      cancelledAt: "2026-04-20T13:00:00.000Z",
      cancelledBy: "ana@empresa.com",
    }));

    expect(cancelled).toMatchObject({
      id: "booking-2",
      status: "CANCELLED",
      cancelledBy: "ana@empresa.com",
    });
  });
});
