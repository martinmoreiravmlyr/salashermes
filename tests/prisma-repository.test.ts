import { describe, expect, it } from "vitest";
import { mapPrismaBooking, mapPrismaRoom } from "@/lib/prisma-repository";

describe("prisma repository mappers", () => {
  it("maps a Prisma room to the UI room contract using the room slug as public id", () => {
    const room = mapPrismaRoom({
      id: "db-room-1",
      slug: "sala-6a",
      name: "SALA 6A",
      capacity: 8,
      location: "Piso 2 · Montevideo",
      owner: "Creatividad",
      type: "SALA",
      equipment: ["TV", "Meet"],
      color: "bg-indigo-500",
      photoUrl: null,
      isReservable: true,
      createdAt: new Date("2026-04-20T00:00:00.000Z"),
      updatedAt: new Date("2026-04-20T00:00:00.000Z"),
    });

    expect(room).toEqual({
      id: "sala-6a",
      name: "SALA 6A",
      capacity: 8,
      location: "Piso 2 · Montevideo",
      owner: "Creatividad",
      type: "sala",
      equipment: ["TV", "Meet"],
      color: "bg-indigo-500",
    });
  });

  it("maps a Prisma booking with requester and participants to the service contract", () => {
    const booking = mapPrismaBooking({
      id: "booking-1",
      room: { slug: "sala-bo" },
      requester: { email: "direccion@empresa.com" },
      participants: [
        { user: { email: "finance@empresa.com" } },
        { user: { email: "ana@empresa.com" } },
      ],
      date: new Date("2026-04-24T00:00:00.000Z"),
      startAt: new Date("2026-04-24T10:00:00.000Z"),
      endAt: new Date("2026-04-24T12:30:00.000Z"),
      title: "Comité dirección",
      reason: "Seguimiento mensual",
      status: "CONFIRMED",
      restricted: true,
      requiresApproval: false,
      createdAt: new Date("2026-04-20T12:00:00.000Z"),
      updatedAt: new Date("2026-04-20T13:00:00.000Z"),
      cancelledAt: null,
      cancelledById: null,
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
});
