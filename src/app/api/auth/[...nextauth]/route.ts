import { authHandler, isAuthEnabled } from "@/lib/auth";
import { runAuthHandler } from "@/lib/auth-route";

function disabledResponse() {
  return Response.json(
    {
      error: "Auth.js no está configurado en este entorno. Definí NEXTAUTH_SECRET y MONGODB_URI.",
    },
    { status: 503 },
  );
}

export async function GET(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!isAuthEnabled()) {
    return disabledResponse();
  }

  return runAuthHandler(authHandler, request, context);
}

export async function POST(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!isAuthEnabled()) {
    return disabledResponse();
  }

  return runAuthHandler(authHandler, request, context);
}
