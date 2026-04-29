import { auth } from "@/lib/auth";
import { normalizeCancelBookingForActor } from "@/lib/booking-auth-flow";
import { resolveSessionActor } from "@/lib/auth-credentials";
import { getBookingService } from "@/lib/server-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const actor = resolveSessionActor(await auth());
    const { id } = await context.params;

    const booking = await getBookingService().cancelBooking(
      normalizeCancelBookingForActor(
        {
          bookingId: id,
        },
        actor,
      ),
    );

    return Response.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible cancelar la reserva.";
    const status = /sesión/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
