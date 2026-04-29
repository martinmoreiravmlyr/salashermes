import { registerUser } from "@/lib/auth-credentials";
import { registerUserRequestSchema } from "@/lib/register-api";
import { createMongoUserRepository } from "@/lib/mongoose-user-repository";

export async function POST(request: Request) {
  try {
    const parsed = registerUserRequestSchema.parse(await request.json());
    await registerUser(createMongoUserRepository(), parsed);
    return Response.json({ ok: true, message: "Cuenta creada. Ahora podés iniciar sesión." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible crear la cuenta.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
