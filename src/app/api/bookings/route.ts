import { auth } from "@/lib/auth";
import { normalizeBookingFormForActor } from "@/lib/booking-auth-flow";
import { resolveSessionActor } from "@/lib/auth-credentials";
import { getBookingService } from "@/lib/server-data";

function pick(value: string | null) {
  return value ?? undefined;
}

export async function GET(request: Request) {
  const session = await auth();
  const actor = session ? resolveSessionActor(session) : null;
  const { searchParams } = new URL(request.url);
  const userEmail = actor?.email ?? pick(searchParams.get("userEmail"));
  const mine = searchParams.get("mine") === "true";

  const snapshot = await getBookingService().getDashboardSnapshot({
    week: pick(searchParams.get("week")),
    userEmail,
    filters: {
      owner: pick(searchParams.get("owner")),
      participant: pick(searchParams.get("participant")),
      capacityMin: searchParams.get("capacityMin") ? Number(searchParams.get("capacityMin")) : undefined,
      resourceType: pick(searchParams.get("resourceType")),
      query: pick(searchParams.get("q")),
    },
  });

  return Response.json({
    week: snapshot.week,
    stats: snapshot.stats,
    weekDays: snapshot.weekDays,
    rooms: snapshot.rooms,
    bookings: mine ? snapshot.myBookings : snapshot.bookings,
    myBookings: snapshot.myBookings,
    currentUser: actor ? { email: actor.email, name: actor.name, role: actor.role } : null,
  });
}

export async function POST(request: Request) {
  try {
    const actor = resolveSessionActor(await auth());
    const body = await request.json();
    const booking = await getBookingService().createBooking(
      normalizeBookingFormForActor(
        {
          roomId: body.roomId,
          date: body.date,
          start: body.start,
          end: body.end,
          title: body.title,
          requester: body.requester,
          participants: Array.isArray(body.participants) ? body.participants.join(",") : body.participants,
          reason: body.reason ?? "",
          requiresApproval: String(Boolean(body.requiresApproval)),
        },
        actor,
      ),
    );

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible crear la reserva.";
    const status = /sesión/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
