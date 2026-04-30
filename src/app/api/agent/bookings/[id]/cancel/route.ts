import { resolveAgentActor } from "@/lib/agent-api-auth";
import { getBookingService } from "@/lib/server-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = resolveAgentActor(request);
    const { id } = await context.params;
    const booking = await getBookingService().cancelBooking({
      bookingId: id,
      actorEmail: actor.email,
      isAdmin: actor.isAdmin,
    });

    return Response.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible cancelar la reserva del agente.";
    const status = /token|habilitada/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
