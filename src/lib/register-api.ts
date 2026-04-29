import { z } from "zod";

export const registerUserRequestSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  email: z.string().trim().email("Ingresá un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;
