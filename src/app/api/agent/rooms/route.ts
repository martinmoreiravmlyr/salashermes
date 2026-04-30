import { resolveAgentActor } from "@/lib/agent-api-auth";
import { getBookingService } from "@/lib/server-data";

function pick(value: string | null) {
  return value ?? undefined;
}

export async function GET(request: Request) {
  try {
    resolveAgentActor(request);
    const { searchParams } = new URL(request.url);
    const snapshot = await getBookingService().getDashboardSnapshot({
      week: pick(searchParams.get("week")),
      filters: {},
    });

    return Response.json({ rooms: snapshot.rooms, total: snapshot.rooms.length, week: snapshot.week });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible listar las salas.";
    const status = /token|habilitada/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
