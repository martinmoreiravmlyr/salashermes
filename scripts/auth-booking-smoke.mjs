function readCookiePairs(response) {
  const rawCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  const fallback = response.headers.get("set-cookie");
  const values = rawCookies.length > 0 ? rawCookies : fallback ? [fallback] : [];
  return values
    .map((value) => value.split(";", 1)[0]?.trim())
    .filter(Boolean);
}

function mergeCookieHeaders(current, response) {
  const jar = new Map();

  for (const pair of current.split(/;\s*/).filter(Boolean)) {
    const [name, ...rest] = pair.split("=");
    if (name && rest.length > 0) {
      jar.set(name, `${name}=${rest.join("=")}`);
    }
  }

  for (const pair of readCookiePairs(response)) {
    const [name, ...rest] = pair.split("=");
    if (name && rest.length > 0) {
      jar.set(name, `${name}=${rest.join("=")}`);
    }
  }

  return Array.from(jar.values()).join("; ");
}

async function expectJson(response, label) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${label} failed with ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3005").replace(/\/$/, "");
  const nonce = Date.now();
  const email = `hermes-smoke-${nonce}@empresa.com`;
  const title = `Hermes smoke ${nonce}`;
  const startHour = 8 + (nonce % 10);
  const start = `${String(startHour).padStart(2, "0")}:00`;
  const end = `${String(startHour + 1).padStart(2, "0")}:00`;
  const bookingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  required("NEXTAUTH_SECRET");
  required("NEXTAUTH_URL");
  required("MONGODB_URI");

  let cookie = "";

  const registerResponse = await fetch(`${baseUrl}/api/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Hermes Smoke", email, password: "Sup3rSecret!" }),
  });
  const register = await expectJson(registerResponse, "register");

  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  cookie = mergeCookieHeaders(cookie, csrfResponse);
  const csrf = await expectJson(csrfResponse, "csrf");
  if (!csrf.csrfToken) {
    throw new Error("csrf failed: missing csrfToken");
  }

  const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-auth-return-redirect": "1",
      cookie,
    },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      password: "Sup3rSecret!",
      json: "true",
      callbackUrl: `${baseUrl}/`,
    }),
  });
  await expectJson(loginResponse, "login");
  cookie = mergeCookieHeaders(cookie, loginResponse);

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, { headers: { cookie } });
  const session = await expectJson(sessionResponse, "session");
  if (session.user?.email !== email) {
    throw new Error(`session failed: expected ${email}, got ${session.user?.email ?? "<none>"}`);
  }

  const roomsResponse = await fetch(`${baseUrl}/api/rooms`);
  const roomsBody = await expectJson(roomsResponse, "rooms");
  const room = roomsBody.rooms?.[0];
  if (!room?.id) {
    throw new Error("rooms failed: no reservable rooms returned");
  }

  const createResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      roomId: room.id,
      date: bookingDate,
      start,
      end,
      title,
      participants: "rrhh@empresa.com, lider@empresa.com",
      reason: "Automated smoke test",
      requiresApproval: false,
    }),
  });
  const createBody = await expectJson(createResponse, "create booking");
  if (createBody.booking?.requester !== email) {
    throw new Error(`create booking failed: requester mismatch ${createBody.booking?.requester ?? "<none>"}`);
  }

  const cancelResponse = await fetch(`${baseUrl}/api/bookings/${createBody.booking.id}/cancel`, {
    method: "POST",
    headers: { cookie },
  });
  const cancelBody = await expectJson(cancelResponse, "cancel booking");

  console.log(JSON.stringify({
    register: { status: registerResponse.status, body: register },
    session,
    booking: createBody.booking,
    cancel: cancelBody.booking,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
