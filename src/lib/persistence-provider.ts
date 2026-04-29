export type PersistenceProvider = "demo" | "mongo" | "prisma";

export function resolvePersistenceProvider(env: Record<string, string | undefined>): PersistenceProvider {
  if (env.USE_DEMO_REPOSITORY === "true") {
    return "demo";
  }

  if (env.MONGODB_URI) {
    return "mongo";
  }

  if (env.DATABASE_URL) {
    return "prisma";
  }

  return "demo";
}
