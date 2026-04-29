export type AuthAvailability = {
  enabled: boolean;
  reason: "configured" | "missing-secret" | "missing-mongodb";
};

export function getAuthAvailability(env: Record<string, string | undefined>): AuthAvailability {
  if (!env.NEXTAUTH_SECRET && !env.AUTH_SECRET) {
    return { enabled: false, reason: "missing-secret" };
  }

  if (!env.MONGODB_URI) {
    return { enabled: false, reason: "missing-mongodb" };
  }

  return { enabled: true, reason: "configured" };
}
