"use server";

import { revalidatePath } from "next/cache";
import { normalizeBookingFormForActor, normalizeCancelBookingForActor } from "@/lib/booking-auth-flow";
import { registerUser, resolveSessionActor } from "@/lib/auth-credentials";
import { auth } from "@/lib/auth";
import { createMongoUserRepository } from "@/lib/mongoose-user-repository";
import { getBookingService } from "@/lib/server-data";

export type BookingActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type RegisterActionState = BookingActionState;

export const INITIAL_BOOKING_ACTION_STATE: BookingActionState = {
  status: "idle",
  message: "",
};

export const INITIAL_REGISTER_ACTION_STATE: RegisterActionState = {
  status: "idle",
  message: "",
};

export async function createBookingAction(
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  try {
    const actor = resolveSessionActor(await auth());
    const booking = await getBookingService().createBooking(
      normalizeBookingFormForActor(
        {
          roomId: formData.get("roomId")?.toString(),
          date: formData.get("date")?.toString(),
          start: formData.get("start")?.toString(),
          end: formData.get("end")?.toString(),
          title: formData.get("title")?.toString(),
          requester: formData.get("requester")?.toString(),
          participants: formData.get("participants")?.toString(),
          reason: formData.get("reason")?.toString(),
          requiresApproval: formData.get("requiresApproval")?.toString(),
        },
        actor,
      ),
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
    const actor = resolveSessionActor(await auth());
    await getBookingService().cancelBooking(
      normalizeCancelBookingForActor(
        {
          bookingId: formData.get("bookingId")?.toString(),
          actorEmail: formData.get("actorEmail")?.toString(),
          isAdmin: formData.get("isAdmin")?.toString(),
        },
        actor,
      ),
    );

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

export async function registerUserAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  try {
    await registerUser(createMongoUserRepository(), {
      name: formData.get("name")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
    });

    return {
      status: "success",
      message: "Cuenta creada. Ahora podés iniciar sesión.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible crear la cuenta.",
    };
  }
}
