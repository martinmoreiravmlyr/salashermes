"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingActionState } from "@/app/actions";

const INITIAL_BOOKING_ACTION_STATE: BookingActionState = {
  status: "idle",
  message: "",
};

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [state, setState] = useState<BookingActionState>(INITIAL_BOOKING_ACTION_STATE);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setState(INITIAL_BOOKING_ACTION_STATE);

        startTransition(async () => {
          const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
            method: "POST",
          });

          const data = (await response.json()) as { error?: string };
          if (!response.ok) {
            setState({
              status: "error",
              message: data.error ?? "No fue posible cancelar la reserva.",
            });
            return;
          }

          setState({
            status: "success",
            message: "Reserva cancelada correctamente.",
          });
          router.refresh();
        });
      }}
    >
      {state.status !== "idle" && state.message ? (
        <p
          className={`rounded-2xl border px-3 py-2 text-xs ${
            state.status === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
              : "border-rose-500/20 bg-rose-500/10 text-rose-100"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Cancelando..." : "Cancelar"}
      </button>
    </form>
  );
}
