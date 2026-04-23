import { canCancelBooking } from "@/lib/booking-rules";
import type { CreateBookingInput } from "@/lib/booking-service";
import type { Booking } from "@/lib/schedule";

export function parseParticipantEmails(value: string) {
  return value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readString(value: FormDataEntryValue | string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeBookingMutationInput(
  values: Record<string, FormDataEntryValue | string | undefined>,
): CreateBookingInput {
  return {
    roomId: readString(values.roomId),
    date: readString(values.date),
    start: readString(values.start),
    end: readString(values.end),
    title: readString(values.title),
    requester: readString(values.requester),
    participants: parseParticipantEmails(readString(values.participants)),
    reason: readString(values.reason),
    requiresApproval: values.requiresApproval === "on" || values.requiresApproval === "true",
  };
}

export function canManageBookingFromUi(booking: Booking, currentUser: string, isAdmin = false) {
  return canCancelBooking({
    isAdmin,
    isOwner: booking.requester === currentUser,
    status: booking.status,
  });
}
