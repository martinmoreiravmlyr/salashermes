export type AuthBookingSmokeInput = {
  baseUrl: string;
  name: string;
  email: string;
  password: string;
  booking: {
    date: string;
    start: string;
    end: string;
    title: string;
    participants: string;
    reason: string;
  };
};

export type AuthBookingSmokeResult = {
  register: { status: number; body: { ok?: boolean; message?: string; error?: string } };
  session: { user?: { email?: string | null; name?: string | null; role?: string | null } | null; expires?: string };
  booking: { id: string; status: string; requester: string; title: string };
  cancel: { id: string; status: string; cancelledBy?: string | null };
};

type JsonObject = Record<string, unknown>;

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function readCookiePairs(response: Response) {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const rawCookies = typeof getSetCookie === "function" ? getSetCookie.call(response.headers) : [];
  const fallback = response.headers.get("set-cookie");
  const values = rawCookies.length > 0 ? rawCookies : fallback ? [fallback] : [];
  return values
    .map((value) => value.split(";", 1)[0]?.trim())
    .filter((value): value is string => Boolean(value));
}

function mergeCookieHeaders(current: string, response: Response) {
  const jar = new Map<string, string>();

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

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function expectJson<T>(response: Response, label: string): Promise<T> {
  const data = await parseJson<T>(response);
  if (!response.ok) {
    throw new Error(`${label} failed with ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function runAuthBookingSmoke(input: AuthBookingSmokeInput): Promise<AuthBookingSmokeResult> {
  const baseUrl = trimTrailingSlash(input.baseUrl);

  const registerResponse = await fetch(`${baseUrl}/api/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
    }),
  });
  const registerBody = await parseJson<{ ok?: boolean; message?: string; error?: string }>(registerResponse);
  if (!registerResponse.ok || !registerBody.ok) {
    throw new Error(`register failed: ${JSON.stringify(registerBody)}`);
  }

  let cookie = "";

  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  cookie = mergeCookieHeaders(cookie, csrfResponse);
  const csrfBody = await expectJson<{ csrfToken?: string }>(csrfResponse, "csrf");
  if (!csrfBody.csrfToken) {
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
      csrfToken: csrfBody.csrfToken,
      email: input.email,
      password: input.password,
      json: "true",
      callbackUrl: `${baseUrl}/`,
    }),
  });
  await expectJson<JsonObject>(loginResponse, "login");
  cookie = mergeCookieHeaders(cookie, loginResponse);
  if (!cookie) {
    throw new Error("login failed: missing session cookie");
  }

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie },
  });
  const sessionBody = await expectJson<{ user?: { email?: string | null; name?: string | null; role?: string | null } | null; expires?: string }>(sessionResponse, "session");
  if (sessionBody.user?.email !== input.email) {
    throw new Error(`session failed: expected ${input.email}, got ${sessionBody.user?.email ?? "<none>"}`);
  }

  const roomsResponse = await fetch(`${baseUrl}/api/rooms`);
  const roomsBody = await expectJson<{ rooms?: Array<{ id: string; name: string }> }>(roomsResponse, "rooms");
  const room = roomsBody.rooms?.[0];
  if (!room) {
    throw new Error("rooms failed: no reservable rooms returned");
  }

  const createResponse = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      roomId: room.id,
      date: input.booking.date,
      start: input.booking.start,
      end: input.booking.end,
      title: input.booking.title,
      participants: input.booking.participants,
      reason: input.booking.reason,
      requiresApproval: false,
    }),
  });
  const createBody = await expectJson<{ booking?: { id: string; status: string; requester: string; title: string } }>(createResponse, "create booking");
  if (!createBody.booking) {
    throw new Error("create booking failed: missing booking payload");
  }
  if (createBody.booking.requester !== input.email) {
    throw new Error(`create booking failed: requester mismatch ${createBody.booking.requester}`);
  }

  const cancelResponse = await fetch(`${baseUrl}/api/bookings/${createBody.booking.id}/cancel`, {
    method: "POST",
    headers: { cookie },
  });
  const cancelBody = await expectJson<{ booking?: { id: string; status: string; cancelledBy?: string | null } }>(cancelResponse, "cancel booking");
  if (!cancelBody.booking) {
    throw new Error("cancel booking failed: missing booking payload");
  }

  return {
    register: { status: registerResponse.status, body: registerBody },
    session: sessionBody,
    booking: createBody.booking,
    cancel: {
      id: cancelBody.booking.id,
      status: cancelBody.booking.status,
      cancelledBy: cancelBody.booking.cancelledBy,
    },
  };
}
