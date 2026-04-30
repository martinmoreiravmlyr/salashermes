import { describe, expect, it, vi, afterEach } from "vitest";
import { runAuthBookingSmoke } from "@/lib/auth-booking-smoke";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runAuthBookingSmoke", () => {
  it("registers, signs in, creates a booking and cancels it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, message: "Cuenta creada. Ahora podés iniciar sesión." }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: "csrf-token" }), {
          status: 200,
          headers: { "content-type": "application/json", "set-cookie": "next-auth.csrf-token=csrf-cookie; Path=/; HttpOnly" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: "http://localhost:3000/" }), {
          status: 200,
          headers: { "content-type": "application/json", "set-cookie": "next-auth.session-token=abc; Path=/; HttpOnly" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { email: "ana@empresa.com", name: "Ana", role: "USER" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rooms: [{ id: "atlas", name: "Box VML planta chica" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ booking: { id: "booking-1", status: "CONFIRMED", requester: "ana@empresa.com", title: "Planning" } }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ booking: { id: "booking-1", status: "CANCELLED", cancelledBy: "ana@empresa.com" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await runAuthBookingSmoke({
      baseUrl: "http://localhost:3000",
      name: "Ana",
      email: "ana@empresa.com",
      password: "Sup3rSecret!",
      booking: {
        date: "2026-05-01",
        start: "09:00",
        end: "10:00",
        title: "Planning",
        participants: "rrhh@empresa.com",
        reason: "Sprint",
      },
    });

    expect(result.register.status).toBe(201);
    expect(result.session.user?.email).toBe("ana@empresa.com");
    expect(result.booking.requester).toBe("ana@empresa.com");
    expect(result.cancel.status).toBe("CANCELLED");
    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(fetchMock.mock.calls[2]?.[1]?.headers).toMatchObject({
      cookie: "next-auth.csrf-token=csrf-cookie",
    });
    expect(fetchMock.mock.calls[3]?.[1]?.headers).toMatchObject({
      cookie: "next-auth.csrf-token=csrf-cookie; next-auth.session-token=abc",
    });
  });
});
