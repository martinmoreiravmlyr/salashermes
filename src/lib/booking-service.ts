import { randomUUID } from "node:crypto";
import { areIntervalsOverlapping, canCancelBooking, isSlotAllowed } from "@/lib/booking-rules";
import {
  bookings as seedBookings,
  buildWeekDays,
  filterRooms,
  getDashboardStats,
  getWeeklyBookingsByRoom,
  normalizeWeekAnchor,
  rooms as seedRooms,
  type Booking,
  type Room,
  type RoomFilters,
} from "@/lib/schedule";

export type BookingRecord = Booking & {
  reason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt?: string;
};

export type CreateBookingInput = {
  roomId: string;
  date: string;
  start: string;
  end: string;
  title: string;
  requester: string;
  participants: string[];
  reason: string;
  requiresApproval: boolean;
};

export type DashboardSnapshotInput = {
  week?: string;
  userEmail?: string;
  filters: RoomFilters;
};

export type CancelBookingRequest = {
  bookingId: string;
  actorEmail: string;
  isAdmin: boolean;
};

export type BookingRepository = {
  listRooms(): Promise<Room[]>;
  listBookings(): Promise<BookingRecord[]>;
  createBooking(booking: BookingRecord): Promise<BookingRecord>;
  updateBooking(bookingId: string, updater: (booking: BookingRecord) => BookingRecord): Promise<BookingRecord>;
};

export function createInMemoryRepository(initial?: { rooms?: Room[]; bookings?: BookingRecord[] }): BookingRepository {
  const roomStore = structuredClone(initial?.rooms ?? seedRooms);
  const bookingStore = structuredClone((initial?.bookings ?? seedBookings) as BookingRecord[]);

  return {
    async listRooms() {
      return structuredClone(roomStore);
    },
    async listBookings() {
      return structuredClone(bookingStore);
    },
    async createBooking(booking) {
      bookingStore.push(structuredClone(booking));
      return structuredClone(booking);
    },
    async updateBooking(bookingId, updater) {
      const index = bookingStore.findIndex((booking) => booking.id === bookingId);
      if (index === -1) {
        throw new Error("Reserva no encontrada.");
      }
      bookingStore[index] = structuredClone(updater(bookingStore[index]!));
      return structuredClone(bookingStore[index]!);
    },
  };
}

export function createDemoRepository() {
  return createInMemoryRepository();
}

export function createBookingService(repository: BookingRepository) {
  return {
    async getDashboardSnapshot(input: DashboardSnapshotInput) {
      const rooms = await repository.listRooms();
      const bookings = await repository.listBookings();
      const week = normalizeWeekAnchor(input.week);
      const weekDays = buildWeekDays(week);
      const filteredRooms = filterRooms(rooms, bookings, input.filters);
      const visibleRoomIds = new Set(filteredRooms.map((room) => room.id));
      const visibleBookings = bookings.filter((booking) => visibleRoomIds.has(booking.roomId));
      const grouped = getWeeklyBookingsByRoom(filteredRooms, visibleBookings, weekDays);
      const stats = getDashboardStats(filteredRooms, visibleBookings, weekDays);
      const myBookings = input.userEmail
        ? bookings.filter(
            (booking) =>
              booking.requester === input.userEmail ||
              booking.participants.some((participant) => participant === input.userEmail),
          )
        : [];

      return {
        week,
        weekDays,
        rooms: filteredRooms,
        bookings: visibleBookings,
        grouped,
        stats,
        myBookings,
      };
    },

    async createBooking(input: CreateBookingInput) {
      const rooms = await repository.listRooms();
      const bookings = await repository.listBookings();
      const room = rooms.find((current) => current.id === input.roomId);

      if (!room) {
        throw new Error("La sala indicada no existe.");
      }

      const startDate = new Date(`${input.date}T${input.start}:00.000Z`);
      const endDate = new Date(`${input.date}T${input.end}:00.000Z`);
      const slot = isSlotAllowed({
        start: startDate,
        end: endDate,
        allowedStartHour: 8,
        allowedEndHour: 20,
        maxDurationMinutes: 180,
        blockedDates: [],
      });

      if (!slot.allowed) {
        throw new Error(slot.reason ?? "La franja seleccionada no es válida.");
      }

      const overlaps = bookings.some((booking) => {
        if (booking.roomId !== input.roomId || booking.date !== input.date || booking.status === "CANCELLED") {
          return false;
        }

        const bookingStart = new Date(`${booking.date}T${booking.start}:00.000Z`);
        const bookingEnd = new Date(`${booking.date}T${booking.end}:00.000Z`);
        return areIntervalsOverlapping(startDate, endDate, bookingStart, bookingEnd);
      });

      if (overlaps) {
        throw new Error("La reserva se solapa con otra existente.");
      }

      const booking: BookingRecord = {
        id: randomUUID(),
        roomId: input.roomId,
        date: input.date,
        start: input.start,
        end: input.end,
        title: input.title,
        requester: input.requester,
        participants: input.participants,
        reason: input.reason,
        status: input.requiresApproval ? "PENDING" : "CONFIRMED",
        createdAt: new Date().toISOString(),
      };

      return repository.createBooking(booking);
    },

    async cancelBooking(input: CancelBookingRequest) {
      const bookings = await repository.listBookings();
      const booking = bookings.find((current) => current.id === input.bookingId);

      if (!booking) {
        throw new Error("Reserva no encontrada.");
      }

      const allowed = canCancelBooking({
        isAdmin: input.isAdmin,
        isOwner: booking.requester === input.actorEmail,
        status: booking.status,
      });

      if (!allowed) {
        throw new Error("No tenés permiso para cancelar esta reserva.");
      }

      return repository.updateBooking(input.bookingId, (current) => ({
        ...current,
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
        cancelledBy: input.actorEmail,
      }));
    },
  };
}
