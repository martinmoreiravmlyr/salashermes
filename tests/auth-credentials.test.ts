import { describe, expect, it, vi } from "vitest";
import {
  authorizeUser,
  hashPassword,
  registerUser,
  resolveSessionActor,
  type UserRecord,
} from "@/lib/auth-credentials";

describe("auth credentials helpers", () => {
  it("hashes passwords and validates them for later login", async () => {
    const passwordHash = await hashPassword("Sup3rSecret!");

    expect(passwordHash).not.toBe("Sup3rSecret!");

    const user = await authorizeUser(
      { findByEmail: vi.fn().mockResolvedValue({ email: "ana@empresa.com", passwordHash, role: "USER", name: "Ana" }) },
      { email: "ana@empresa.com", password: "Sup3rSecret!" },
    );

    expect(user).toMatchObject({ email: "ana@empresa.com", role: "USER", name: "Ana" });
  });

  it("registers a new user and rejects duplicated emails", async () => {
    const store = new Map<string, UserRecord>();
    const repository = {
      findByEmail: vi.fn(async (email: string) => store.get(email) ?? null),
      createUser: vi.fn(async (user: UserRecord) => {
        store.set(user.email, user);
        return user;
      }),
    };

    const created = await registerUser(repository, {
      name: "Ana",
      email: "ana@empresa.com",
      password: "Sup3rSecret!",
    });

    expect(created).toMatchObject({ name: "Ana", email: "ana@empresa.com", role: "USER" });
    expect(created.passwordHash).not.toBe("Sup3rSecret!");

    await expect(
      registerUser(repository, {
        name: "Ana",
        email: "ana@empresa.com",
        password: "Sup3rSecret!",
      }),
    ).rejects.toThrow(/ya existe/i);
  });

  it("resolves the current actor from a session and marks admins correctly", () => {
    expect(
      resolveSessionActor({ user: { email: "admin@empresa.com", name: "Admin", role: "ADMIN" } }),
    ).toEqual({ email: "admin@empresa.com", name: "Admin", isAdmin: true, role: "ADMIN" });

    expect(() => resolveSessionActor(null)).toThrow(/sesión/i);
  });
});
