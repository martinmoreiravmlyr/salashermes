import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { bookingVisualState } from "@/lib/booking-rules";
import { getBookingService } from "@/lib/server-data";
import { getWeekNavigation, normalizeWeekAnchor, rooms, type Booking } from "@/lib/schedule";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type BadgeTone = {
  label: string;
  chip: string;
  dot: string;
};

const stateStyles: Record<string, BadgeTone> = {
  reservado: {
    label: "reservado",
    chip: "border-white/10 bg-white/[0.04] text-slate-100",
    dot: "bg-slate-200",
  },
  pendiente: {
    label: "pendiente",
    chip: "border-amber-500/20 bg-amber-500/10 text-amber-100",
    dot: "bg-amber-400",
  },
  restringido: {
    label: "restringido",
    chip: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100",
    dot: "bg-fuchsia-400",
  },
  "mi reserva": {
    label: "mi reserva",
    chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    dot: "bg-emerald-400",
  },
  participante: {
    label: "participante",
    chip: "border-indigo-500/20 bg-indigo-500/10 text-indigo-100",
    dot: "bg-indigo-400",
  },
  pasado: {
    label: "pasado",
    chip: "border-slate-500/20 bg-slate-500/10 text-slate-200",
    dot: "bg-slate-500",
  },
  "no reservable": {
    label: "no reservable",
    chip: "border-rose-500/20 bg-rose-500/10 text-rose-100",
    dot: "bg-rose-400",
  },
};

const legendItems = [
  stateStyles.reservado,
  stateStyles.pendiente,
  stateStyles["mi reserva"],
  stateStyles.restringido,
] as const;

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

function badgeForBooking(booking: Booking, currentUser: string) {
  const isMine = booking.requester === currentUser;
  const isParticipant = !isMine && booking.participants.includes(currentUser);

  const state = bookingVisualState({
    isMine,
    isParticipant,
    isPast: false,
    requiresApproval: booking.status === "PENDING",
    status: booking.status,
    reservable: true,
    restricted: booking.restricted ?? false,
  });

  return stateStyles[state] ?? stateStyles.reservado;
}

function Surface({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
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
    <Surface className="rounded-[24px] p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </Surface>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-slate-500">{children}</p>;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const weekAnchor = normalizeWeekAnchor(pickFirst(params.week));
  const navigation = getWeekNavigation(weekAnchor);

  const filters = {
    owner: pickFirst(params.owner) ?? "",
    participant: pickFirst(params.participant) ?? "",
    capacityMin: Number(pickFirst(params.capacityMin) ?? "0") || undefined,
    resourceType: pickFirst(params.resourceType) ?? "all",
    query: pickFirst(params.q) ?? "",
  };

  const currentUser = process.env.DEMO_USER_EMAIL ?? "ana@empresa.com";
  const snapshot = await getBookingService().getDashboardSnapshot({
    week: weekAnchor,
    userEmail: currentUser,
    filters,
  });

  const weekDays = snapshot.weekDays;
  const filteredRooms = snapshot.rooms;
  const weeklyBookings = snapshot.grouped;
  const stats = snapshot.stats;
  const myBookings = snapshot.myBookings;
  const owners = Array.from(new Set(rooms.map((room) => room.owner))).sort();
  const resourceTypes = Array.from(new Set(rooms.map((room) => room.type)));

  const weekRange = `${format(parseISO(weekDays[0].iso), "dd/MM")} — ${format(parseISO(weekDays.at(-1)!.iso), "dd/MM")}`;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className="sticky top-0 z-20">
        <Surface className="rounded-[22px] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#5e6ad2]/20 text-lg font-semibold text-white">
                SH
              </div>
              <div>
                <p className="text-sm font-medium text-white">Salas Hermes</p>
                <p className="text-sm text-slate-400">Presentación interna · workspace Montevideo</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-400">
                Quick look listo para demo · {weekRange}
              </div>
              <div className="flex flex-wrap gap-2">
                <ThemeToggle />
                <Link
                  href="/api/rooms"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  API rooms
                </Link>
                <Link
                  href={`/api/bookings?week=${weekAnchor}&userEmail=${encodeURIComponent(currentUser)}`}
                  className="rounded-full bg-[#5e6ad2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7170ff]"
                >
                  API bookings
                </Link>
              </div>
            </div>
          </div>
        </Surface>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_380px]">
        <Surface className="relative overflow-hidden p-7 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,106,210,0.26),transparent_28%),radial-gradient(circle_at_75%_20%,rgba(113,112,255,0.14),transparent_22%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">
                Diseño listo para presentar
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-none tracking-[-0.07em] text-white sm:text-5xl lg:text-6xl">
                  Dashboard premium para mostrar la disponibilidad semanal de salas.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                  Dejé una versión más ejecutiva, tipo Linear/Vercel: foco en claridad, lectura rápida,
                  estados visibles y recorrido de producto listo para que lo presentés aunque todavía
                  estemos usando fallback demo detrás.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="#agenda"
                  className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-slate-200"
                >
                  Ver agenda semanal
                </Link>
                <Link
                  href="#filtros"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Ajustar filtros
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Salas visibles" value={stats.rooms} helper="Scope actual" />
                <StatCard label="Reservas semana" value={stats.reservations} helper={weekRange} />
                <StatCard label="Ocupación media" value={`${stats.averageOccupancy}%`} helper={`${stats.pending} pendiente(s)`} />
              </div>
            </div>

            <Surface className="rounded-[26px] border-white/[0.1] bg-black/20 p-5">
              <SectionEyebrow>Resumen ejecutivo</SectionEyebrow>
              <div className="mt-5 space-y-5">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Usuario demo</p>
                  <p className="mt-2 text-xl font-semibold text-white">{currentUser}</p>
                  <p className="mt-1 text-sm text-slate-500">Simula el panel de “mis reservas”.</p>
                </div>

                <div className="space-y-3">
                  {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                        <span className="text-sm text-slate-200">{item.label}</span>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] ${item.chip}`}>
                        visible
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-[22px] border border-[#5e6ad2]/20 bg-[#5e6ad2]/10 p-4 text-sm leading-6 text-indigo-100">
                  Próxima fase técnica: reemplazar el repositorio demo por Prisma real y sumar Auth.js.
                </div>
              </div>
            </Surface>
          </div>
        </Surface>

        <div className="grid gap-6">
          <Surface className="p-6" id="filtros">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionEyebrow>Exploración</SectionEyebrow>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Filtros y navegación</h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={buildHref(params, { week: navigation.previous })}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  ← Prev
                </Link>
                <Link
                  href={buildHref(params, { week: navigation.next })}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Next →
                </Link>
              </div>
            </div>

            <form className="mt-6 space-y-4" method="GET">
              <input type="hidden" name="week" value={weekAnchor} />

              <label className="block space-y-2 text-sm text-slate-300">
                <span>Búsqueda</span>
                <input
                  name="q"
                  defaultValue={filters.query}
                  placeholder="Sala, equipamiento, ubicación"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-[#7170ff] focus:bg-white/[0.05]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-slate-300">
                  <span>Owner</span>
                  <select
                    name="owner"
                    defaultValue={filters.owner}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#7170ff]"
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
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-[#7170ff] focus:bg-white/[0.05]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-slate-300">
                  <span>Capacidad mínima</span>
                  <input
                    name="capacityMin"
                    defaultValue={filters.capacityMin ?? ""}
                    type="number"
                    min="1"
                    placeholder="10"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-[#7170ff] focus:bg-white/[0.05]"
                  />
                </label>

                <label className="block space-y-2 text-sm text-slate-300">
                  <span>Tipo</span>
                  <select
                    name="resourceType"
                    defaultValue={filters.resourceType}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#7170ff]"
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
                <button className="rounded-full bg-[#5e6ad2] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#7170ff]">
                  Aplicar filtros
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Limpiar
                </Link>
              </div>
            </form>
          </Surface>

          <Surface className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionEyebrow>My workspace</SectionEyebrow>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Mis reservas</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                {myBookings.length} items
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {myBookings.slice(0, 4).map((booking) => {
                const badge = badgeForBooking(booking, currentUser);
                return (
                  <article key={booking.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{booking.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{booking.date} · {booking.start} - {booking.end}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] ${badge.chip}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {booking.requester === currentUser ? "Solicitada por mí" : "Soy participante"}
                    </p>
                  </article>
                );
              })}
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Surface className="p-6">
          <SectionEyebrow>Infra</SectionEyebrow>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Backend listo para la siguiente demo</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Ya existe schema Prisma, service layer y endpoints para crear, listar y cancelar reservas.
          </p>
        </Surface>
        <Surface className="p-6">
          <SectionEyebrow>Producto</SectionEyebrow>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Narrativa clara para stakeholders</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Hero, métricas, agenda y filtros quedaron ordenados para explicar el valor en menos de 3 minutos.
          </p>
        </Surface>
        <Surface className="p-6">
          <SectionEyebrow>Siguiente sprint</SectionEyebrow>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Auth, forms y persistencia real</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Lo que sigue es completar la operación end-to-end: login, formularios y PostgreSQL productivo.
          </p>
        </Surface>
      </section>

      <section id="agenda">
        <Surface className="overflow-hidden">
          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionEyebrow>Agenda semanal</SectionEyebrow>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">Grilla por sala</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Vista pensada para presentación: cards limpias, códigos de estado consistentes y catálogo real de salas tomado de tu referencia visual.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {legendItems.map((item) => (
                  <span key={item.label} className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${item.chip}`}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1180px]">
              <div className="grid grid-cols-[280px_repeat(5,minmax(0,1fr))] bg-white/[0.02]">
                <div className="border-r border-white/10 px-6 py-4 text-[11px] font-medium uppercase tracking-[0.3em] text-slate-500">
                  Salas
                </div>
                {weekDays.map((day) => (
                  <div key={day.iso} className="border-r border-white/10 px-5 py-4 last:border-r-0">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{day.shortLabel}</p>
                    <p className="mt-2 text-sm text-slate-200">{day.fullLabel}</p>
                  </div>
                ))}
              </div>

              {filteredRooms.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No hay salas que coincidan con los filtros actuales.</div>
              ) : (
                filteredRooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-[280px_repeat(5,minmax(0,1fr))] border-t border-white/10">
                    <div className="border-r border-white/10 px-6 py-6">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${room.color}`} />
                        <div>
                          <p className="text-base font-medium text-white">{room.name}</p>
                          <p className="mt-1 text-sm text-slate-400">{room.capacity} personas · {room.type}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-500">{room.location}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{room.equipment.join(" · ")}</p>
                    </div>

                    {weekDays.map((day) => {
                      const dayBookings = weeklyBookings[room.id]?.[day.iso] ?? [];

                      return (
                        <div key={day.iso} className="border-r border-white/10 px-4 py-4 last:border-r-0">
                          <div className="min-h-44 rounded-[24px] border border-white/8 bg-white/[0.02] p-2.5">
                            {dayBookings.length === 0 ? (
                              <div className="flex h-full min-h-40 items-center justify-center rounded-[20px] border border-dashed border-white/8 text-sm text-slate-600">
                                Disponible
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2.5">
                                {dayBookings.map((booking) => {
                                  const badge = badgeForBooking(booking, currentUser);
                                  return (
                                    <article key={booking.id} className="rounded-[20px] border border-white/10 bg-[#14161b] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-medium text-white">{booking.title}</p>
                                          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                                            {booking.start} — {booking.end}
                                          </p>
                                        </div>
                                        <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.24em] ${badge.chip}`}>
                                          {badge.label}
                                        </span>
                                      </div>
                                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                                        <span>{booking.requester}</span>
                                        <span>{booking.participants.length} invitado(s)</span>
                                      </div>
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
        </Surface>
      </section>
    </main>
  );
}
