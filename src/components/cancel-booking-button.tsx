"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingAction, INITIAL_BOOKING_ACTION_STATE } from "@/app/actions";

export function CancelBookingButton({
  bookingId,
  actorEmail,
  isAdmin = false,
}: {
  bookingId: string;
  actorEmail: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(cancelBookingAction, INITIAL_BOOKING_ACTION_STATE);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="actorEmail" value={actorEmail} />
      <input type="hidden" name="isAdmin" value={String(isAdmin)} />

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
