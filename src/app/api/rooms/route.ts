import { getBookingService } from "@/lib/server-data";

export async function GET() {
  const snapshot = await getBookingService().getDashboardSnapshot({
    filters: {},
  });

  return Response.json({ rooms: snapshot.rooms, total: snapshot.rooms.length });
}
