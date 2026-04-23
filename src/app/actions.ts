"use server";

import { revalidatePath } from "next/cache";
import { normalizeBookingMutationInput } from "@/lib/booking-form";
import { getBookingService } from "@/lib/server-data";

export type BookingActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_BOOKING_ACTION_STATE: BookingActionState = {
  status: "idle",
  message: "",
};

export async function createBookingAction(
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  try {
    const booking = await getBookingService().createBooking(
      normalizeBookingMutationInput({
        roomId: formData.get("roomId")?.toString(),
        date: formData.get("date")?.toString(),
        start: formData.get("start")?.toString(),
        end: formData.get("end")?.toString(),
        title: formData.get("title")?.toString(),
        requester: formData.get("requester")?.toString(),
        participants: formData.get("participants")?.toString(),
        reason: formData.get("reason")?.toString(),
        requiresApproval: formData.get("requiresApproval")?.toString(),
      }),
    );

    revalidatePath("/");

    return {
      status: "success",
      message:
        booking.status === "PENDING"
          ? "Reserva creada y enviada a aprobación."
          : "Reserva creada correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible crear la reserva.",
    };
  }
}

export async function cancelBookingAction(
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  try {
    await getBookingService().cancelBooking({
      bookingId: formData.get("bookingId")?.toString() ?? "",
      actorEmail: formData.get("actorEmail")?.toString() ?? "",
      isAdmin: formData.get("isAdmin")?.toString() === "true",
    });

    revalidatePath("/");

    return {
      status: "success",
      message: "Reserva cancelada correctamente.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible cancelar la reserva.",
    };
  }
}
