import { compare, hash } from "bcryptjs";

export type UserRole = "ADMIN" | "USER";

export type UserRecord = {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
};

export type SessionActor = {
  email: string;
  name: string;
  role: UserRole;
  isAdmin: boolean;
};

type UserLookupRepository = {
  findByEmail(email: string): Promise<UserRecord | null>;
};

type UserWriteRepository = UserLookupRepository & {
  createUser(user: UserRecord): Promise<UserRecord>;
};

type CredentialsInput = {
  email: string;
  password: string;
};

type RegistrationInput = {
  name: string;
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function authorizeUser(repository: UserLookupRepository, credentials: CredentialsInput) {
  const email = normalizeEmail(credentials.email);
  const user = await repository.findByEmail(email);

  if (!user) {
    throw new Error("Usuario o contraseña inválidos.");
  }

  const matches = await compare(credentials.password, user.passwordHash);
  if (!matches) {
    throw new Error("Usuario o contraseña inválidos.");
  }

  return user;
}

export async function registerUser(repository: UserWriteRepository, input: RegistrationInput) {
  const email = normalizeEmail(input.email);
  const existingUser = await repository.findByEmail(email);

  if (existingUser) {
    throw new Error("Ya existe un usuario con ese email.");
  }

  const user: UserRecord = {
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    role: "USER",
  };

  return repository.createUser(user);
}

export function resolveSessionActor(session: { user?: { email?: string | null; name?: string | null; role?: string | null } } | null): SessionActor {
  const user = session?.user;
  const email = user?.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Necesitás iniciar sesión para continuar.");
  }

  return {
    email,
    name: user?.name?.trim() || email,
    role: user?.role === "ADMIN" ? "ADMIN" : "USER",
    isAdmin: user?.role === "ADMIN",
  };
}
