#!/usr/bin/env node

const [, , command, ...args] = process.argv;

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

const options = parseArgs(args);
const baseUrl = (process.env.SALAS_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const token = process.env.TELEGRAM_AGENT_API_TOKEN ?? process.env.AGENT_API_TOKEN;

if (!command || ["help", "--help", "-h"].includes(command)) {
  console.log(`Uso:
  node scripts/telegram-agent-client.mjs rooms [--week 2026-05-04]
  node scripts/telegram-agent-client.mjs bookings --requesterEmail ana@empresa.com [--week 2026-05-04]
  node scripts/telegram-agent-client.mjs create --requester ana@empresa.com --roomId atlas --date 2026-05-05 --start 10:00 --end 11:00 --title "Planning" [--participants a@x.com,b@y.com] [--reason "..."] [--requiresApproval true]
  node scripts/telegram-agent-client.mjs cancel --id booking-id

Variables:
  SALAS_BASE_URL
  TELEGRAM_AGENT_API_TOKEN (o AGENT_API_TOKEN)`);
  process.exit(0);
}

if (!token) {
  fail("Falta TELEGRAM_AGENT_API_TOKEN o AGENT_API_TOKEN en el entorno.");
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    fail(JSON.stringify(payload, null, 2));
  }

  console.log(JSON.stringify(payload, null, 2));
}

switch (command) {
  case "rooms": {
    const params = new URLSearchParams();
    if (options.week) params.set("week", options.week);
    await request(`/api/agent/rooms${params.size ? `?${params}` : ""}`);
    break;
  }
  case "bookings": {
    const params = new URLSearchParams();
    for (const key of ["week", "requesterEmail", "owner", "participant", "capacityMin", "resourceType", "q"]) {
      if (options[key]) params.set(key, options[key]);
    }
    await request(`/api/agent/bookings${params.size ? `?${params}` : ""}`);
    break;
  }
  case "create": {
    for (const key of ["requester", "roomId", "date", "start", "end", "title"]) {
      if (!options[key]) {
        fail(`Falta --${key}`);
      }
    }

    const participants = options.participants
      ? options.participants.split(",").map((value) => value.trim()).filter(Boolean)
      : [];

    await request("/api/agent/bookings", {
      method: "POST",
      body: JSON.stringify({
        requester: options.requester,
        roomId: options.roomId,
        date: options.date,
        start: options.start,
        end: options.end,
        title: options.title,
        participants,
        reason: options.reason ?? "",
        requiresApproval: options.requiresApproval ?? false,
      }),
    });
    break;
  }
  case "cancel": {
    if (!options.id) {
      fail("Falta --id");
    }
    await request(`/api/agent/bookings/${encodeURIComponent(options.id)}/cancel`, { method: "POST" });
    break;
  }
  default:
    fail(`Comando no soportado: ${command}`);
}
