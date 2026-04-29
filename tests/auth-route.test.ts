import { describe, expect, it, vi } from "vitest";
import { runAuthHandler } from "@/lib/auth-route";

describe("runAuthHandler", () => {
  it("invokes the NextAuth handler as a function with request and context", async () => {
    const response = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const handler = vi.fn().mockResolvedValue(response);
    const request = new Request("http://localhost/api/auth/providers");
    const context = { params: Promise.resolve({ nextauth: ["providers"] }) };

    const result = await runAuthHandler(handler, request, context);

    expect(handler).toHaveBeenCalledWith(request, context);
    expect(result).toBe(response);
  });
});
