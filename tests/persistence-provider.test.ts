import { describe, expect, it } from "vitest";
import { resolvePersistenceProvider } from "@/lib/persistence-provider";

describe("resolvePersistenceProvider", () => {
  it("prefers the demo repository when explicitly requested", () => {
    expect(
      resolvePersistenceProvider({
        USE_DEMO_REPOSITORY: "true",
        MONGODB_URI: "mongodb://localhost:27017/salas",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/salas",
      }),
    ).toBe("demo");
  });

  it("prefers Mongo when a MONGODB_URI exists", () => {
    expect(
      resolvePersistenceProvider({
        USE_DEMO_REPOSITORY: "false",
        MONGODB_URI: "mongodb://localhost:27017/salas",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/salas",
      }),
    ).toBe("mongo");
  });

  it("falls back to Prisma before the in-memory demo repository", () => {
    expect(
      resolvePersistenceProvider({
        USE_DEMO_REPOSITORY: "false",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/salas",
      }),
    ).toBe("prisma");

    expect(resolvePersistenceProvider({ USE_DEMO_REPOSITORY: "false" })).toBe("demo");
  });
});
