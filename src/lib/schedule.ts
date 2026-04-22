import { addWeeks, differenceInMinutes, format, isValid, parseISO, startOfWeek } from "date-fns";

export type RoomType = "sala" | "focus" | "auditorio";
export type BookingStatus = "CONFIRMED" | "PENDING" | "CANCELLED";

export type Room = {
  id: string;
  name: string;
  capacity: number;
  location: string;
  owner: string;
  type: RoomType;
  equipment: string[];
  color: string;
};

export type Booking = {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  title: string;
  requester: string;
  participants: string[];
  status: BookingStatus;
  restricted?: boolean;
};

export type WeekDay = {
  iso: string;
  shortLabel: string;
  fullLabel: string;
  isToday: boolean;
};

export type RoomFilters = {
  owner?: string;
  participant?: string;
  capacityMin?: number;
  resourceType?: string;
  query?: string;
};

const DEFAULT_ANCHOR = "2026-04-22";
const HOURS_PER_WORKDAY = 10;

export const rooms: Room[] = [
  {
    id: "atlas",
    name: "Sala Atlas",
    capacity: 12,
    location: "Piso 4 · Montevideo",
    owner: "Operaciones",
    type: "sala",
    equipment: ["TV 75p", "Miro", "Videollamada"],
    color: "bg-sky-500",
  },
  {
    id: "bora",
    name: "Sala Bora",
    capacity: 20,
    location: "Piso 4 · Montevideo",
    owner: "People",
    type: "auditorio",
    equipment: ["Proyector", "Streaming", "Micrófonos"],
    color: "bg-violet-500",
  },
  {
    id: "celeste",
    name: "Focus Celeste",
    capacity: 6,
    location: "Piso 2 · Montevideo",
    owner: "IT",
    type: "focus",
    equipment: ["Monitor 34p", "Zoom Room"],
    color: "bg-emerald-500",
  },
  {
    id: "delta",
    name: "Sala Delta",
    capacity: 10,
    location: "Piso 1 · Montevideo",
    owner: "Comercial",
    type: "sala",
    equipment: ["Pizarra", "Speakerphone"],
    color: "bg-amber-500",
  },
];

export const bookings: Booking[] = [
  {
    id: "r1",
    roomId: "bora",
    date: "2026-04-20",
    start: "08:00",
    end: "18:00",
    title: "All hands Q2",
    requester: "lucia@empresa.com",
    participants: ["ceo@empresa.com", "ops@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r2",
    roomId: "atlas",
    date: "2026-04-21",
    start: "08:00",
    end: "18:00",
    title: "Sprint planning Producto",
    requester: "martin@empresa.com",
    participants: ["ana@empresa.com", "diego@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r3",
    roomId: "atlas",
    date: "2026-04-22",
    start: "08:00",
    end: "13:00",
    title: "One-on-ones Engineering",
    requester: "vale@empresa.com",
    participants: ["ana@empresa.com", "rrhh@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r4",
    roomId: "atlas",
    date: "2026-04-22",
    start: "13:00",
    end: "18:00",
    title: "Comité de arquitectura",
    requester: "fede@empresa.com",
    participants: ["arquitectura@empresa.com", "ana@empresa.com"],
    status: "PENDING",
  },
  {
    id: "r5",
    roomId: "delta",
    date: "2026-04-23",
    start: "08:00",
    end: "18:00",
    title: "Workshop partners LATAM",
    requester: "santi@empresa.com",
    participants: ["ventas@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r6",
    roomId: "celeste",
    date: "2026-04-23",
    start: "08:00",
    end: "18:00",
    title: "Entrevistas backend",
    requester: "it@empresa.com",
    participants: ["recruiting@empresa.com"],
    status: "CONFIRMED",
    restricted: true,
  },
  {
    id: "r7",
    roomId: "bora",
    date: "2026-04-24",
    start: "08:00",
    end: "18:00",
    title: "Demo day clientes",
    requester: "marketing@empresa.com",
    participants: ["partners@empresa.com"],
    status: "CONFIRMED",
  },
];

export function normalizeWeekAnchor(raw?: string): string {
  if (!raw) return DEFAULT_ANCHOR;
  const parsed = parseISO(raw);
  if (!isValid(parsed)) return DEFAULT_ANCHOR;
  return format(parsed, "yyyy-MM-dd");
}

export function buildWeekDays(anchorIso: string): WeekDay[] {
  const monday = startOfWeek(parseISO(normalizeWeekAnchor(anchorIso)), { weekStartsOn: 1 });

  return Array.from({ length: 5 }, (_, index) => {
    const current = addWeeks(monday, 0);
    current.setDate(monday.getDate() + index);
    const iso = format(current, "yyyy-MM-dd");
    return {
      iso,
      shortLabel: new Intl.DateTimeFormat("es-UY", { weekday: "short", day: "numeric" }).format(current),
      fullLabel: new Intl.DateTimeFormat("es-UY", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(current),
      isToday: iso === DEFAULT_ANCHOR,
    };
  });
}

export function filterRooms(allRooms: Room[], allBookings: Booking[], filters: RoomFilters): Room[] {
  return allRooms.filter((room) => {
    if (filters.capacityMin && room.capacity < filters.capacityMin) return false;
    if (filters.resourceType && filters.resourceType !== "all" && room.type !== filters.resourceType) return false;
    if (filters.owner && !room.owner.toLowerCase().includes(filters.owner.toLowerCase())) return false;
    if (filters.query) {
      const haystack = [room.name, room.location, room.owner, room.equipment.join(" ")].join(" ").toLowerCase();
      if (!haystack.includes(filters.query.toLowerCase())) return false;
    }
    if (filters.participant) {
      const participant = filters.participant.toLowerCase();
      const matches = allBookings.some(
        (booking) =>
          booking.roomId === room.id &&
          booking.participants.some((current) => current.toLowerCase().includes(participant)),
      );
      if (!matches) return false;
    }
    return true;
  });
}

export function getWeeklyBookingsByRoom(allRooms: Room[], allBookings: Booking[], weekDays: WeekDay[]) {
  const validDays = new Set(weekDays.map((day) => day.iso));

  return Object.fromEntries(
    allRooms.map((room) => [
      room.id,
      Object.fromEntries(
        weekDays.map((day) => [
          day.iso,
          allBookings.filter((booking) => booking.roomId === room.id && validDays.has(booking.date) && booking.date === day.iso),
        ]),
      ),
    ]),
  ) as Record<string, Record<string, Booking[]>>;
}

export function getDashboardStats(allRooms: Room[], allBookings: Booking[], weekDays: WeekDay[]) {
  const validDays = new Set(weekDays.map((day) => day.iso));
  const weekly = allBookings.filter((booking) => validDays.has(booking.date));
  const bookedMinutes = weekly.reduce((total, booking) => total + getBookingDurationMinutes(booking), 0);
  const totalMinutes = allRooms.length * weekDays.length * HOURS_PER_WORKDAY * 60;

  return {
    rooms: allRooms.length,
    reservations: weekly.length,
    pending: weekly.filter((booking) => booking.status === "PENDING").length,
    averageOccupancy: Math.round((bookedMinutes / totalMinutes) * 100),
  };
}

export function getBookingDurationMinutes(booking: Booking) {
  const start = parseISO(`${booking.date}T${booking.start}:00`);
  const end = parseISO(`${booking.date}T${booking.end}:00`);
  return differenceInMinutes(end, start);
}

export function getWeekNavigation(anchorIso: string) {
  const anchor = parseISO(normalizeWeekAnchor(anchorIso));
  return {
    previous: format(addWeeks(anchor, -1), "yyyy-MM-dd"),
    current: DEFAULT_ANCHOR,
    next: format(addWeeks(anchor, 1), "yyyy-MM-dd"),
  };
}
