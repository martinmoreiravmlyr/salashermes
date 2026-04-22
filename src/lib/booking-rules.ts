export type BookingStatus = "CONFIRMED" | "PENDING" | "CANCELLED";

export type SlotAllowedInput = {
  start: Date;
  end: Date;
  allowedStartHour: number;
  allowedEndHour: number;
  maxDurationMinutes: number;
  blockedDates: string[];
};

export type SlotAllowedResult = {
  allowed: boolean;
  reason?: string;
};

export type BookingVisualState =
  | "mi reserva"
  | "participante"
  | "pasado"
  | "pendiente"
  | "no reservable"
  | "restringido"
  | "reservado";

export type BookingVisualStateInput = {
  isMine: boolean;
  isParticipant: boolean;
  isPast: boolean;
  requiresApproval: boolean;
  status: BookingStatus;
  reservable: boolean;
  restricted: boolean;
};

export type CancelBookingInput = {
  isAdmin: boolean;
  isOwner: boolean;
  status: BookingStatus;
};

export function areIntervalsOverlapping(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function isSlotAllowed(input: SlotAllowedInput): SlotAllowedResult {
  const { start, end, allowedStartHour, allowedEndHour, maxDurationMinutes, blockedDates } = input;

  if (end <= start) {
    return { allowed: false, reason: 'La franja horaria no es válida.' };
  }

  const slotDate = start.toISOString().slice(0, 10);
  if (blockedDates.includes(slotDate)) {
    return { allowed: false, reason: 'La fecha está bloqueada.' };
  }

  const startHour = start.getUTCHours() + start.getUTCMinutes() / 60;
  const endHour = end.getUTCHours() + end.getUTCMinutes() / 60;

  if (startHour < allowedStartHour || endHour > allowedEndHour) {
    return { allowed: false, reason: 'La reserva está fuera del horario habilitado.' };
  }

  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (durationMinutes > maxDurationMinutes) {
    return { allowed: false, reason: 'La duración supera el máximo permitido.' };
  }

  return { allowed: true };
}

export function bookingVisualState(input: BookingVisualStateInput): BookingVisualState {
  if (input.isMine) return 'mi reserva';
  if (input.isParticipant) return 'participante';
  if (input.isPast) return 'pasado';
  if (input.status === 'PENDING' || input.requiresApproval) return 'pendiente';
  if (!input.reservable) return 'no reservable';
  if (input.restricted) return 'restringido';
  return 'reservado';
}

export function canCancelBooking(input: CancelBookingInput): boolean {
  if (input.status === 'CANCELLED') {
    return false;
  }

  return input.isAdmin || input.isOwner;
}
