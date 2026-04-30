import { agentBookingRequestSchema, agentBookingsQuerySchema } from "@/lib/agent-booking-api";
import { resolveAgentActor } from "@/lib/agent-api-auth";
import { getBookingService } from "@/lib/server-data";

function fromSearchParams(request: Request) {
  const { searchParams } = new URL(request.url);
  return {
    week: searchParams.get("week") ?? undefined,
    requesterEmail: searchParams.get("requesterEmail") ?? undefined,
    owner: searchParams.get("owner") ?? undefined,
    participant: searchParams.get("participant") ?? undefined,
    capacityMin: searchParams.get("capacityMin") ?? undefined,
    resourceType: searchParams.get("resourceType") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };
}

export async function GET(request: Request) {
  try {
    const actor = resolveAgentActor(request);
    const query = agentBookingsQuerySchema.parse(fromSearchParams(request));
    const snapshot = await getBookingService().getDashboardSnapshot({
      week: query.week,
      userEmail: query.requesterEmail,
      filters: {
        owner: query.owner,
        participant: query.participant,
        capacityMin: query.capacityMin,
        resourceType: query.resourceType,
        query: query.q,
      },
    });

    return Response.json({
      actor: { email: actor.email, name: actor.name, role: actor.role },
      week: snapshot.week,
      stats: snapshot.stats,
      weekDays: snapshot.weekDays,
      rooms: snapshot.rooms,
      bookings: snapshot.bookings,
      myBookings: snapshot.myBookings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible listar las reservas.";
    const status = /token|habilitada/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    resolveAgentActor(request);
    const body = agentBookingRequestSchema.parse(await request.json());
    const booking = await getBookingService().createBooking(body);
    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible crear la reserva del agente.";
    const status = /token|habilitada/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
