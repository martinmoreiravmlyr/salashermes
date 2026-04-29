import { normalizeBookingMutationInput } from "@/lib/booking-form";
import type { CancelBookingRequest } from "@/lib/booking-service";
import type { SessionActor } from "@/lib/auth-credentials";

export function normalizeBookingFormForActor(
  values: Record<string, FormDataEntryValue | string | undefined>,
  actor: SessionActor,
) {
  const normalized = normalizeBookingMutationInput({ ...values, requester: actor.email });
  return { ...normalized, requester: actor.email };
}

export function normalizeCancelBookingForActor(
  values: Record<string, FormDataEntryValue | string | undefined>,
  actor: SessionActor,
): CancelBookingRequest {
  return {
    bookingId: typeof values.bookingId === "string" ? values.bookingId : "",
    actorEmail: actor.email,
    isAdmin: actor.isAdmin,
  };
}
