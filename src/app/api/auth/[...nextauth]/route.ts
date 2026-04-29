import { authHandler, isAuthEnabled } from "@/lib/auth";

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

  return authHandler.GET(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!isAuthEnabled()) {
    return disabledResponse();
  }

  return authHandler.POST(request, context);
}
