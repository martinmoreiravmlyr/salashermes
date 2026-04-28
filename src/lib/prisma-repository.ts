import { format } from "date-fns";
import type { BookingRepository, BookingRecord } from "@/lib/booking-service";
import type { BookingStatus, Room, RoomType } from "@/lib/schedule";

type PrismaRoomLike = {
  slug: string;
  name: string;
  capacity: number;
  location: string;
  owner: string;
  type: string;
  equipment: unknown;
  color?: string | null;
};

type PrismaBookingLike = {
  id: string;
  room: { slug: string };
  requester: { email: string };
  participants: Array<{ user: { email: string } }>;
  date: Date;
  startAt: Date;
  endAt: Date;
  title: string;
  reason?: string | null;
  status: string;
  restricted?: boolean | null;
  createdAt?: Date;
  cancelledAt?: Date | null;
};

type PrismaClientLike = {
  room: {
    findMany(args?: unknown): Promise<PrismaRoomLike[]>;
    findUnique(args: unknown): Promise<{ id: string } | null>;
  };
  user: {
    upsert(args: unknown): Promise<{ id: string }>;
  };
  booking: {
    findMany(args?: unknown): Promise<PrismaBookingLike[]>;
    create(args: unknown): Promise<PrismaBookingLike>;
    update(args: unknown): Promise<PrismaBookingLike>;
  };
};

const DEFAULT_ROOM_COLOR = "bg-slate-500";
const ROOM_TYPE_MAP: Record<string, RoomType> = {
  SALA: "sala",
  BOX: "box",
  FOCUS: "focus",
  AUDITORIO: "sala",
};

function asEquipment(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toDateOnly(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toTimeOnly(date: Date) {
  return format(date, "HH:mm");
}

function toPrismaDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function toPrismaDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`);
}

export function mapPrismaRoom(room: PrismaRoomLike): Room {
  return {
    id: room.slug,
    name: room.name,
    capacity: room.capacity,
    location: room.location,
    owner: room.owner,
    type: ROOM_TYPE_MAP[room.type] ?? "sala",
    equipment: asEquipment(room.equipment),
    color: room.color ?? DEFAULT_ROOM_COLOR,
  };
}

export function mapPrismaBooking(booking: PrismaBookingLike): BookingRecord {
  return {
    id: booking.id,
    roomId: booking.room.slug,
    date: toDateOnly(booking.date),
    start: toTimeOnly(booking.startAt),
    end: toTimeOnly(booking.endAt),
    title: booking.title,
    requester: booking.requester.email,
    participants: booking.participants.map((participant) => participant.user.email),
    status: booking.status as BookingStatus,
    restricted: Boolean(booking.restricted),
    reason: booking.reason ?? undefined,
    createdAt: booking.createdAt?.toISOString(),
    cancelledAt: booking.cancelledAt?.toISOString(),
  };
}

const bookingInclude = {
  room: { select: { slug: true } },
  requester: { select: { email: true } },
  participants: { include: { user: { select: { email: true } } } },
};

export function createPrismaRepository(prismaClient: unknown): BookingRepository {
  const prisma = prismaClient as PrismaClientLike;

  return {
    async listRooms() {
      const rooms = await prisma.room.findMany({ orderBy: [{ name: "asc" }] });
      return rooms.map(mapPrismaRoom);
    },

    async listBookings() {
      const bookings = await prisma.booking.findMany({ include: bookingInclude, orderBy: [{ startAt: "asc" }] });
      return bookings.map(mapPrismaBooking);
    },

    async createBooking(booking) {
      const room = await prisma.room.findUnique({ where: { slug: booking.roomId }, select: { id: true } });
      if (!room) throw new Error("La sala indicada no existe.");

      const requester = await prisma.user.upsert({
        where: { email: booking.requester },
        update: {},
        create: { email: booking.requester, name: booking.requester.split("@")[0] ?? booking.requester },
        select: { id: true },
      });

      const participantUsers = await Promise.all(
        booking.participants.map((email) =>
          prisma.user.upsert({
            where: { email },
            update: {},
            create: { email, name: email.split("@")[0] ?? email },
            select: { id: true },
          }),
        ),
      );

      const created = await prisma.booking.create({
        data: {
          id: booking.id,
          roomId: room.id,
          requesterId: requester.id,
          date: toPrismaDate(booking.date),
          startAt: toPrismaDateTime(booking.date, booking.start),
          endAt: toPrismaDateTime(booking.date, booking.end),
          title: booking.title,
          reason: booking.reason,
          status: booking.status,
          requiresApproval: booking.status === "PENDING",
          restricted: booking.restricted ?? false,
          participants: {
            create: participantUsers.map((user) => ({ userId: user.id })),
          },
        },
        include: bookingInclude,
      });

      return mapPrismaBooking(created);
    },

    async updateBooking(bookingId, updater) {
      const bookings = await this.listBookings();
      const current = bookings.find((booking) => booking.id === bookingId);
      if (!current) throw new Error("Reserva no encontrada.");

      const next = updater(current);
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: next.status,
          cancelledAt: next.cancelledAt ? new Date(next.cancelledAt) : undefined,
        },
        include: bookingInclude,
      });

      return mapPrismaBooking(updated);
    },
  };
}
