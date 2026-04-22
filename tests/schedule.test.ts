import { describe, expect, it } from "vitest";
import {
  buildWeekDays,
  filterRooms,
  getDashboardStats,
  getWeeklyBookingsByRoom,
  rooms,
  bookings,
} from "@/lib/schedule";

describe("schedule helpers", () => {
  it("builds a monday-first work week from an anchor date", () => {
    expect(buildWeekDays("2026-04-22").map((day) => day.iso)).toEqual([
      "2026-04-20",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
    ]);
  });

  it("filters rooms by capacity, type and participant", () => {
    const result = filterRooms(rooms, bookings, {
      capacityMin: 10,
      resourceType: "sala",
      participant: "ana@empresa.com",
    });

    expect(result.map((room) => room.id)).toEqual(["atlas"]);
  });

  it("groups weekly bookings by room and weekday", () => {
    const week = buildWeekDays("2026-04-22");
    const grouped = getWeeklyBookingsByRoom(rooms, bookings, week);

    expect(grouped.atlas["2026-04-22"]).toHaveLength(2);
    expect(grouped.delta["2026-04-23"][0]?.title).toContain("Workshop");
    expect(grouped.delta["2026-04-24"]).toEqual([]);
  });

  it("calculates dashboard stats from the filtered set", () => {
    const result = getDashboardStats(rooms, bookings, buildWeekDays("2026-04-22"));

    expect(result.rooms).toBe(4);
    expect(result.reservations).toBe(7);
    expect(result.pending).toBe(1);
    expect(result.averageOccupancy).toBe(30);
  });
});
