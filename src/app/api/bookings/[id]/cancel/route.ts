import { getBookingService } from "@/lib/server-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const { id } = await context.params;

    const booking = await getBookingService().cancelBooking({
      bookingId: id,
      actorEmail: body.actorEmail,
      isAdmin: Boolean(body.isAdmin),
    });

    return Response.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible cancelar la reserva.";
    return Response.json({ error: message }, { status: 400 });
  }
}
