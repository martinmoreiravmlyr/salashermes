import { addWeeks, differenceInMinutes, format, isValid, parseISO, startOfWeek } from "date-fns";

export type RoomType = "sala" | "box" | "focus";
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
    name: "Box VML planta chica",
    capacity: 10,
    location: "Planta chica · Montevideo",
    owner: "Operaciones",
    type: "box",
    equipment: ["TV", "Meet", "Pizarra"],
    color: "bg-sky-500",
  },
  {
    id: "bora",
    name: "Box VML planta grande",
    capacity: 14,
    location: "Planta grande · Montevideo",
    owner: "People",
    type: "box",
    equipment: ["TV grande", "Videollamada", "Speakerphone"],
    color: "bg-violet-500",
  },
  {
    id: "celeste",
    name: "SALA 12",
    capacity: 6,
    location: "Piso 1 · Montevideo",
    owner: "IT",
    type: "focus",
    equipment: ["Monitor", "Zoom Room"],
    color: "bg-emerald-500",
  },
  {
    id: "delta",
    name: "SALA 4",
    capacity: 12,
    location: "Piso 1 · Montevideo",
    owner: "Comercial",
    type: "sala",
    equipment: ["Pizarra", "Speakerphone"],
    color: "bg-amber-500",
  },
  {
    id: "sala-5",
    name: "SALA 5",
    capacity: 8,
    location: "Piso 1 · Montevideo",
    owner: "Clientes",
    type: "sala",
    equipment: ["TV", "HDMI"],
    color: "bg-rose-500",
  },
  {
    id: "sala-6a",
    name: "SALA 6A",
    capacity: 8,
    location: "Piso 2 · Montevideo",
    owner: "Strategy",
    type: "sala",
    equipment: ["Pizarra", "Meet"],
    color: "bg-cyan-500",
  },
  {
    id: "sala-6b",
    name: "SALA 6B",
    capacity: 8,
    location: "Piso 2 · Montevideo",
    owner: "Creatividad",
    type: "sala",
    equipment: ["TV", "Apple TV"],
    color: "bg-indigo-500",
  },
  {
    id: "sala-bo",
    name: "Sala BO",
    capacity: 16,
    location: "Board area · Montevideo",
    owner: "Dirección",
    type: "sala",
    equipment: ["Pantalla", "Speakerphone", "Coffee point"],
    color: "bg-fuchsia-500",
  },
];

export const bookings: Booking[] = [
  {
    id: "r1",
    roomId: "bora",
    date: "2026-04-20",
    start: "08:00",
    end: "11:00",
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
    end: "10:00",
    title: "Sprint planning Producto",
    requester: "martin@empresa.com",
    participants: ["ana@empresa.com", "diego@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r3",
    roomId: "sala-5",
    date: "2026-04-21",
    start: "11:00",
    end: "12:00",
    title: "Catch-up con cliente",
    requester: "comercial@empresa.com",
    participants: ["clientes@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r4",
    roomId: "sala-6a",
    date: "2026-04-22",
    start: "09:00",
    end: "11:00",
    title: "Planning estrategia",
    requester: "strategy@empresa.com",
    participants: ["pm@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r5",
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
    id: "r6",
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
    id: "r7",
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
    id: "r8",
    roomId: "celeste",
    date: "2026-04-23",
    start: "08:00",
    end: "12:00",
    title: "Entrevistas backend",
    requester: "it@empresa.com",
    participants: ["recruiting@empresa.com"],
    status: "CONFIRMED",
    restricted: true,
  },
  {
    id: "r9",
    roomId: "sala-6b",
    date: "2026-04-23",
    start: "14:00",
    end: "16:00",
    title: "Review creativa",
    requester: "creatividad@empresa.com",
    participants: ["brand@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r10",
    roomId: "bora",
    date: "2026-04-24",
    start: "08:00",
    end: "18:00",
    title: "Demo day clientes",
    requester: "marketing@empresa.com",
    participants: ["partners@empresa.com"],
    status: "CONFIRMED",
  },
  {
    id: "r11",
    roomId: "sala-bo",
    date: "2026-04-24",
    start: "10:00",
    end: "12:00",
    title: "Comité dirección",
    requester: "direccion@empresa.com",
    participants: ["finance@empresa.com"],
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
    const current = new Date(monday);
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
