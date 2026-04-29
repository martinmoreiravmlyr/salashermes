import Link from "next/link";
import { format, parseISO } from "date-fns";
import { AuthPanel } from "@/components/auth-panel";
import { BookingForm } from "@/components/booking-form";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { bookingVisualState } from "@/lib/booking-rules";
import { canManageBookingFromUi } from "@/lib/booking-form";
import { auth } from "@/lib/auth";
import { getAuthAvailability } from "@/lib/auth-config";
import { resolveSessionActor } from "@/lib/auth-credentials";
import { getBookingService } from "@/lib/server-data";
import { getWeekNavigation, normalizeWeekAnchor, rooms, type Booking } from "@/lib/schedule";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

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
      className={`rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-1)] shadow-[0_0_0_1px_var(--border-soft),0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl ${className}`}
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
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--text-faint)]">{label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{helper}</p>
    </Surface>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--text-faint)]">{children}</p>;
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

  const authAvailability = getAuthAvailability(process.env);
  const session = await auth();
  const actor = session ? resolveSessionActor(session) : null;
  const currentUser = actor?.email ?? process.env.DEMO_USER_EMAIL ?? "ana@empresa.com";
  const snapshot = await getBookingService().getDashboardSnapshot({
    week: weekAnchor,
    userEmail: actor?.email,
    filters,
  });

  const weekDays = snapshot.weekDays;
  const filteredRooms = snapshot.rooms;
  const weeklyBookings = snapshot.grouped;
  const stats = snapshot.stats;
  const myBookings = snapshot.myBookings;
  const bookingRooms = filteredRooms.length > 0 ? filteredRooms : rooms;
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
                <p className="text-sm font-medium text-[var(--text-primary)]">Salas WPP</p>
                <p className="text-sm text-[var(--text-muted)]">Presentación interna · workspace Montevideo</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-muted)]">
                Quick look listo para demo · {weekRange}
              </div>
              <div className="flex flex-wrap gap-2">
                <ThemeToggle />
                <Link
                  href="/api/rooms"
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)]"
                >
                  API rooms
                </Link>
                <Link
                  href={`/api/bookings?week=${weekAnchor}${actor ? "" : `&userEmail=${encodeURIComponent(currentUser)}`}`}
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                Diseño listo para presentar
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-none tracking-[-0.07em] text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                  Dashboard premium para mostrar la disponibilidad semanal de salas.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                  Dejé una versión más ejecutiva, tipo Linear/Vercel: foco en claridad, lectura rápida,
                  estados visibles y recorrido de producto listo para que lo presentés aunque todavía
                  estemos usando fallback demo detrás.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="#agenda"
                  className="rounded-full bg-[var(--surface-inverse)] px-5 py-3 text-sm font-medium text-[var(--surface-strong)] transition opacity-95 hover:opacity-100"
                >
                  Ver agenda semanal
                </Link>
                <Link
                  href="#filtros"
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)]"
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

            <Surface className="rounded-[26px] border-[var(--border-strong)] bg-[var(--surface-2)] p-5">
              <SectionEyebrow>Resumen ejecutivo</SectionEyebrow>
              <div className="mt-5 space-y-5">
                <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface-2)] p-4">
                  <p className="text-sm text-[var(--text-muted)]">{actor ? "Usuario autenticado" : "Modo público"}</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{actor?.name ?? "Invitado"}</p>
                  <p className="mt-1 text-sm text-[var(--text-faint)]">{actor ? actor.email : authAvailability.reason === "missing-secret" ? "Falta NEXTAUTH_SECRET en este entorno." : "Iniciá sesión para crear y cancelar reservas."}</p>
                </div>

                {actor ? <SignOutButton /> : null}

                <div className="space-y-3">
                  {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                        <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] ${item.chip}`}>
                        visible
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-[22px] border border-[#5e6ad2]/20 bg-[#5e6ad2]/10 p-4 text-sm leading-6 text-indigo-100">
                  {actor
                    ? "Tu sesión ya gobierna las reservas: el usuario sale del servidor y no de campos ocultos."
                    : authAvailability.reason === "missing-secret" ? "La home queda operativa aunque falte NEXTAUTH_SECRET, pero tenés que configurarlo en Vercel para habilitar login." : "Auth.js ya está integrado. Creá una cuenta o iniciá sesión para operar reservas reales."}
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
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Filtros y navegación</h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={buildHref(params, { week: navigation.previous })}
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)]"
                >
                  ← Prev
                </Link>
                <Link
                  href={buildHref(params, { week: navigation.next })}
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)]"
                >
                  Next →
                </Link>
              </div>
            </div>

            <form className="mt-6 space-y-4" method="GET">
              <input type="hidden" name="week" value={weekAnchor} />

              <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
                <span>Búsqueda</span>
                <input
                  name="q"
                  defaultValue={filters.query}
                  placeholder="Sala, equipamiento, ubicación"
                  className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[#7170ff] focus:bg-[var(--surface-3)]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
                  <span>Owner</span>
                  <select
                    name="owner"
                    defaultValue={filters.owner}
                    className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
                  >
                    <option value="">Todos</option>
                    {owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
                  <span>Participante</span>
                  <input
                    name="participant"
                    defaultValue={filters.participant}
                    placeholder="ana@empresa.com"
                    className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[#7170ff] focus:bg-[var(--surface-3)]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
                  <span>Capacidad mínima</span>
                  <input
                    name="capacityMin"
                    defaultValue={filters.capacityMin ?? ""}
                    type="number"
                    min="1"
                    placeholder="10"
                    className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[#7170ff] focus:bg-[var(--surface-3)]"
                  />
                </label>

                <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
                  <span>Tipo</span>
                  <select
                    name="resourceType"
                    defaultValue={filters.resourceType}
                    className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
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
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-contrast)] hover:bg-[var(--surface-3)]"
                >
                  Limpiar
                </Link>
              </div>
            </form>
          </Surface>

          <Surface className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionEyebrow>Operación real</SectionEyebrow>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Nueva reserva</h2>
              </div>
              <span className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                Sprint 1
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {actor
                ? "La reserva se crea con tu identidad de sesión y refresca el dashboard sin salir de la pantalla."
                : authAvailability.reason === "missing-secret"
                  ? "Este deploy no tiene NEXTAUTH_SECRET configurado. La home sigue levantando, pero el login queda deshabilitado hasta definirlo en Vercel."
                  : "Primero iniciá sesión o creá una cuenta para habilitar la operación real sobre MongoDB."}
            </p>
            {actor ? (
              <BookingForm rooms={bookingRooms} currentUser={actor.email} defaultDate={weekDays[0]?.iso ?? weekAnchor} />
            ) : authAvailability.enabled ? (
              <div className="mt-5">
                <AuthPanel />
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
                Auth deshabilitado en este entorno. En Vercel definí <strong>NEXTAUTH_SECRET</strong> y dejá <strong>MONGODB_URI</strong> configurado para habilitar login y operación autenticada.
              </div>
            )}
          </Surface>

          <Surface className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionEyebrow>My workspace</SectionEyebrow>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Mis reservas</h2>
              </div>
              <span className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                {myBookings.length} items
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {myBookings.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-6 text-sm text-[var(--text-muted)]">
                  Todavía no hay reservas asociadas al usuario actual.
                </div>
              ) : (
                myBookings.map((booking) => {
                  const badge = badgeForBooking(booking, currentUser);
                  const canCancel = actor ? canManageBookingFromUi(booking, actor.email, actor.isAdmin) : false;
                  return (
                    <article key={booking.id} className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface-2)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{booking.title}</p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">{booking.date} · {booking.start} - {booking.end}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] ${badge.chip}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--text-faint)]">
                        {booking.requester === currentUser ? "Solicitada por mí" : "Soy participante"}
                      </p>
                      {canCancel ? <CancelBookingButton bookingId={booking.id} /> : null}
                    </article>
                  );
                })
              )}
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Surface className="p-6">
          <SectionEyebrow>Infra</SectionEyebrow>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Backend listo para la siguiente demo</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Ya existe persistencia real en Mongo, auth por sesión y endpoints para crear, listar y cancelar reservas.
          </p>
        </Surface>
        <Surface className="p-6">
          <SectionEyebrow>Producto</SectionEyebrow>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Narrativa clara para stakeholders</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Hero, métricas, agenda y filtros quedaron ordenados para explicar el valor en menos de 3 minutos.
          </p>
        </Surface>
        <Surface className="p-6">
          <SectionEyebrow>Siguiente sprint</SectionEyebrow>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Auth, forms y persistencia real</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Lo que sigue es profundizar aprobaciones, auditoría y experiencia admin sobre la base real.
          </p>
        </Surface>
      </section>

      <section id="agenda">
        <Surface className="overflow-hidden">
          <div className="border-b border-[var(--border-strong)] px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionEyebrow>Agenda semanal</SectionEyebrow>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--text-primary)]">Grilla por sala</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
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
              <div className="grid grid-cols-[280px_repeat(5,minmax(0,1fr))] bg-[var(--surface-1)]">
                <div className="border-r border-[var(--border-strong)] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--text-faint)]">
                  Salas
                </div>
                {weekDays.map((day) => (
                  <div key={day.iso} className="border-r border-[var(--border-strong)] px-5 py-4 last:border-r-0">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-faint)]">{day.shortLabel}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{day.fullLabel}</p>
                  </div>
                ))}
              </div>

              {filteredRooms.length === 0 ? (
                <div className="p-12 text-center text-[var(--text-muted)]">No hay salas que coincidan con los filtros actuales.</div>
              ) : (
                filteredRooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-[280px_repeat(5,minmax(0,1fr))] border-t border-[var(--border-strong)]">
                    <div className="border-r border-[var(--border-strong)] px-6 py-6">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${room.color}`} />
                        <div>
                          <p className="text-base font-medium text-[var(--text-primary)]">{room.name}</p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">{room.capacity} personas · {room.type}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-[var(--text-faint)]">{room.location}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-faint)]">{room.equipment.join(" · ")}</p>
                    </div>

                    {weekDays.map((day) => {
                      const dayBookings = weeklyBookings[room.id]?.[day.iso] ?? [];

                      return (
                        <div key={day.iso} className="border-r border-[var(--border-strong)] px-4 py-4 last:border-r-0">
                          <div className="min-h-44 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-1)] p-2.5">
                            {dayBookings.length === 0 ? (
                              <div className="flex h-full min-h-40 items-center justify-center rounded-[20px] border border-dashed border-[var(--border-strong)] text-sm text-[var(--text-faint)]">
                                Disponible
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2.5">
                                {dayBookings.map((booking) => {
                                  const badge = badgeForBooking(booking, currentUser);
                                  return (
                                    <article key={booking.id} className="rounded-[20px] border border-[var(--border-strong)] bg-[var(--surface-strong)] p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-medium text-[var(--text-primary)]">{booking.title}</p>
                                          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
                                            {booking.start} — {booking.end}
                                          </p>
                                        </div>
                                        <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.24em] ${badge.chip}`}>
                                          {badge.label}
                                        </span>
                                      </div>
                                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-faint)]">
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
