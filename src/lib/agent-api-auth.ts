import { type SessionActor } from "@/lib/auth-credentials";

const DEFAULT_AGENT_EMAIL = "telegram-agent@salas.local";
const DEFAULT_AGENT_NAME = "Telegram Reservas Agent";

function getConfiguredToken(env: NodeJS.ProcessEnv) {
  return env.TELEGRAM_AGENT_API_TOKEN ?? env.AGENT_API_TOKEN ?? "";
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization")?.trim();
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

export function isAgentApiEnabled(env: NodeJS.ProcessEnv) {
  return getConfiguredToken(env).length > 0;
}

export function resolveAgentActor(request: Request, env: NodeJS.ProcessEnv = process.env): SessionActor {
  const configuredToken = getConfiguredToken(env);
  if (!configuredToken) {
    throw new Error("La API del agente no está habilitada.");
  }

  const providedToken = getBearerToken(request);
  if (!providedToken || providedToken !== configuredToken) {
    throw new Error("Token del agente inválido.");
  }

  const email = (env.TELEGRAM_AGENT_EMAIL ?? DEFAULT_AGENT_EMAIL).trim().toLowerCase();
  const name = env.TELEGRAM_AGENT_NAME?.trim() || DEFAULT_AGENT_NAME;

  return {
    email,
    name,
    role: "ADMIN",
    isAdmin: true,
  };
}
