import Link from "next/link";
import { format, parseISO } from "date-fns";
import { bookingVisualState } from "@/lib/booking-rules";
import {
  bookings,
  buildWeekDays,
  filterRooms,
  getDashboardStats,
  getWeekNavigation,
  getWeeklyBookingsByRoom,
  normalizeWeekAnchor,
  rooms,
  type Booking,
} from "@/lib/schedule";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const stateStyles: Record<string, string> = {
  reservado: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  pendiente: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  restringido: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100",
  "mi reserva": "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  participante: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
  pasado: "border-slate-400/30 bg-slate-500/15 text-slate-200",
  "no reservable": "border-rose-400/30 bg-rose-500/15 text-rose-100",
};

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, string | undefined>,
) {
  const query = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    const value = pickFirst(rawValue);
    if (value) query.set(key, value);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      query.delete(key);
      continue;
    }
    query.set(key, value);
  }

  const queryString = query.toString();
  return queryString ? `/?${queryString}` : "/";
}

function badgeForBooking(booking: Booking) {
  const state = bookingVisualState({
    isMine: false,
    isParticipant: false,
    isPast: false,
    requiresApproval: booking.status === "PENDING",
    status: booking.status,
    reservable: true,
    restricted: booking.restricted ?? false,
  });

  return {
    label: state,
    className: stateStyles[state] ?? stateStyles.reservado,
  };
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/10 backdrop-blur">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </article>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const weekAnchor = normalizeWeekAnchor(pickFirst(params.week));
  const weekDays = buildWeekDays(weekAnchor);
  const navigation = getWeekNavigation(weekAnchor);

  const filters = {
    owner: pickFirst(params.owner) ?? "",
    participant: pickFirst(params.participant) ?? "",
    capacityMin: Number(pickFirst(params.capacityMin) ?? "0") || undefined,
    resourceType: pickFirst(params.resourceType) ?? "all",
    query: pickFirst(params.q) ?? "",
  };

  const filteredRooms = filterRooms(rooms, bookings, filters);
  const roomIds = new Set(filteredRooms.map((room) => room.id));
  const filteredBookings = bookings.filter((booking) => roomIds.has(booking.roomId));
  const weeklyBookings = getWeeklyBookingsByRoom(filteredRooms, filteredBookings, weekDays);
  const stats = getDashboardStats(filteredRooms, filteredBookings, weekDays);
  const owners = Array.from(new Set(rooms.map((room) => room.owner))).sort();
  const resourceTypes = Array.from(new Set(rooms.map((room) => room.type)));

  const weekRange = `${format(parseISO(weekDays[0].iso), "dd/MM")} - ${format(parseISO(weekDays.at(-1)!.iso), "dd/MM")}`;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sm text-sky-100">
              MVP deployable · sin backend todavía
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Salas Hermes
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Ya dejé una primera versión visual lista para probar en Vercel: vista semanal por sala,
              filtros operativos, métricas rápidas y estado de reservas para validar flujo y look & feel
              antes de conectar Prisma, auth y APIs reales.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <StatCard label="Salas visibles" value={stats.rooms} helper="Aplicando filtros actuales" />
            <StatCard label="Reservas semana" value={stats.reservations} helper={weekRange} />
            <StatCard label="Ocupación media" value={`${stats.averageOccupancy}%`} helper={`${stats.pending} pendiente(s)`} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Semana</p>
              <h2 className="text-xl font-semibold text-white">{weekRange}</h2>
            </div>
            <div className="flex gap-2">
              <Link
                href={buildHref(params, { week: navigation.previous })}
                className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-sky-400/40 hover:bg-white/5"
              >
                ←
              </Link>
              <Link
                href={buildHref(params, { week: navigation.next })}
                className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-sky-400/40 hover:bg-white/5"
              >
                →
              </Link>
            </div>
          </div>

          <form className="space-y-4" method="GET">
            <input type="hidden" name="week" value={weekAnchor} />

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Búsqueda</span>
              <input
                name="q"
                defaultValue={filters.query}
                placeholder="Sala, piso, equipamiento..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Owner</span>
              <select
                name="owner"
                defaultValue={filters.owner}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-400/50"
              >
                <option value="">Todos</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Participante</span>
              <input
                name="participant"
                defaultValue={filters.participant}
                placeholder="ana@empresa.com"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Capacidad mínima</span>
                <input
                  name="capacityMin"
                  defaultValue={filters.capacityMin ?? ""}
                  type="number"
                  min="1"
                  placeholder="10"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50"
                />
              </label>

              <label className="block space-y-2 text-sm text-slate-300">
                <span>Tipo</span>
                <select
                  name="resourceType"
                  defaultValue={filters.resourceType}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-400/50"
                >
                  <option value="all">Todos</option>
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button className="rounded-full bg-sky-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-400">
                Aplicar filtros
              </button>
              <Link
                href="/"
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              >
                Limpiar
              </Link>
            </div>
          </form>

          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
            Próximo paso recomendado: conectar este layout con Prisma + Auth.js y persistir reservas reales.
          </div>
        </aside>

        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredRooms.map((room) => (
              <article key={room.id} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{room.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{room.location}</p>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${room.color}`} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/10 px-2.5 py-1">{room.capacity} personas</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1">{room.type}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1">{room.owner}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{room.equipment.join(" · ")}</p>
              </article>
            ))}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[260px_repeat(5,minmax(0,1fr))] border-b border-white/10 bg-white/5">
                  <div className="p-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Sala</div>
                  {weekDays.map((day) => (
                    <div key={day.iso} className="border-l border-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{day.shortLabel}</p>
                      <p className="mt-1 text-sm text-slate-200">{day.fullLabel}</p>
                    </div>
                  ))}
                </div>

                {filteredRooms.length === 0 ? (
                  <div className="p-10 text-center text-slate-300">
                    No hay salas que coincidan con los filtros actuales.
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <div key={room.id} className="grid grid-cols-[260px_repeat(5,minmax(0,1fr))] border-b border-white/10 last:border-b-0">
                      <div className="space-y-3 p-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-3 w-3 rounded-full ${room.color}`} />
                          <div>
                            <p className="font-medium text-white">{room.name}</p>
                            <p className="text-sm text-slate-400">{room.capacity} personas · {room.type}</p>
                          </div>
                        </div>
                        <p className="text-sm leading-6 text-slate-400">{room.equipment.join(" · ")}</p>
                      </div>

                      {weekDays.map((day) => {
                        const dayBookings = weeklyBookings[room.id]?.[day.iso] ?? [];
                        return (
                          <div key={day.iso} className="border-l border-white/10 p-3">
                            <div className="min-h-40 rounded-3xl border border-dashed border-white/8 bg-white/[0.03] p-2">
                              {dayBookings.length === 0 ? (
                                <div className="flex h-full min-h-36 items-center justify-center rounded-[1.2rem] text-center text-sm text-slate-500">
                                  Disponible
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {dayBookings.map((booking) => {
                                    const badge = badgeForBooking(booking);
                                    return (
                                      <article
                                        key={booking.id}
                                        className={`rounded-[1.2rem] border p-3 text-sm shadow-lg shadow-black/5 ${badge.className}`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="font-medium">{booking.title}</p>
                                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-white/80">
                                            {badge.label}
                                          </span>
                                        </div>
                                        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/70">
                                          {booking.start} - {booking.end}
                                        </p>
                                        <p className="mt-2 text-sm text-white/80">Solicita: {booking.requester}</p>
                                      </article>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
