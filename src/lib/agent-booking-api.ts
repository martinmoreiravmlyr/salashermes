import { z } from "zod";

const booleanLike = z.union([z.boolean(), z.string()]).transform((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes", "on", "si", "sí"].includes(value.trim().toLowerCase());
});

const emailField = z.string().trim().email("Ingresá un email válido.").transform((value) => value.toLowerCase());
const optionalText = z.string().trim().optional().transform((value) => value ?? "");

export const agentBookingRequestSchema = z.object({
  roomId: z.string().trim().min(1, "La sala es obligatoria."),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD."),
  start: z.string().trim().regex(/^\d{2}:\d{2}$/, "La hora de inicio debe tener formato HH:mm."),
  end: z.string().trim().regex(/^\d{2}:\d{2}$/, "La hora de fin debe tener formato HH:mm."),
  title: z.string().trim().min(1, "El título es obligatorio."),
  requester: emailField,
  participants: z
    .union([z.array(emailField), z.string().trim()])
    .optional()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value;
      }

      if (!value) {
        return [];
      }

      return value
        .split(/[\n,;]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }),
  reason: optionalText,
  requiresApproval: booleanLike.optional().default(false),
});

export const agentBookingsQuerySchema = z.object({
  week: z.string().trim().optional(),
  requesterEmail: emailField.optional(),
  owner: z.string().trim().optional(),
  participant: z.string().trim().optional(),
  capacityMin: z.coerce.number().int().positive().optional(),
  resourceType: z.string().trim().optional(),
  q: z.string().trim().optional(),
});

export type AgentBookingRequest = z.infer<typeof agentBookingRequestSchema>;
export type AgentBookingsQuery = z.infer<typeof agentBookingsQuerySchema>;
