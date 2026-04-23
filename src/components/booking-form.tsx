"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createBookingAction,
  INITIAL_BOOKING_ACTION_STATE,
  type BookingActionState,
} from "@/app/actions";
import type { Room } from "@/lib/schedule";

function Feedback({ state }: { state: BookingActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const tone =
    state.status === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
      : "border-rose-500/20 bg-rose-500/10 text-rose-100";

  return <p className={`rounded-2xl border px-4 py-3 text-sm ${tone}`}>{state.message}</p>;
}

export function BookingForm({
  rooms,
  currentUser,
  defaultDate,
}: {
  rooms: Room[];
  currentUser: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createBookingAction, INITIAL_BOOKING_ACTION_STATE);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef.current?.reset();
    const form = formRef.current;
    if (!form) {
      router.refresh();
      return;
    }

    const dateInput = form.elements.namedItem("date") as HTMLInputElement | null;
    const requesterInput = form.elements.namedItem("requester") as HTMLInputElement | null;
    if (dateInput) dateInput.value = defaultDate;
    if (requesterInput) requesterInput.value = currentUser;
    router.refresh();
  }, [currentUser, defaultDate, router, state.status]);

  return (
    <form ref={formRef} action={formAction} className="mt-5 space-y-4">
      <input type="hidden" name="requester" value={currentUser} />

      <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
        <span>Sala</span>
        <select
          name="roomId"
          defaultValue={rooms[0]?.id ?? ""}
          required
          className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} · {room.capacity}p
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
          <span>Fecha</span>
          <input
            name="date"
            type="date"
            defaultValue={defaultDate}
            required
            className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
          />
        </label>

        <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
          <span>Título</span>
          <input
            name="title"
            placeholder="Ej: Planning comercial"
            required
            className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[#7170ff] focus:bg-[var(--surface-3)]"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
          <span>Inicio</span>
          <input
            name="start"
            type="time"
            defaultValue="09:00"
            required
            className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
          />
        </label>

        <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
          <span>Fin</span>
          <input
            name="end"
            type="time"
            defaultValue="10:00"
            required
            className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[#7170ff]"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
        <span>Participantes</span>
        <textarea
          name="participants"
          rows={3}
          placeholder="ana@empresa.com, fede@empresa.com"
          className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[#7170ff] focus:bg-[var(--surface-3)]"
        />
      </label>

      <label className="block space-y-2 text-sm text-[var(--text-secondary)]">
        <span>Motivo</span>
        <textarea
          name="reason"
          rows={3}
          placeholder="Contexto corto para la reserva"
          className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[#7170ff] focus:bg-[var(--surface-3)]"
        />
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        <input type="checkbox" name="requiresApproval" className="h-4 w-4 rounded border-[var(--border-strong)]" />
        <span>Requiere aprobación manual</span>
      </label>

      <Feedback state={state} />

      <button
        type="submit"
        disabled={isPending || rooms.length === 0}
        className="w-full rounded-full bg-[#5e6ad2] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#7170ff] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Reservando..." : "Crear reserva"}
      </button>
    </form>
  );
}
