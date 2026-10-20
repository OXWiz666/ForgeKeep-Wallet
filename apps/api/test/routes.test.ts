import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../src/server/prisma.js", () => ({ getPrisma: () => ({ subscriptionEvent: { createMany } }) }));
const { createMany } = vi.hoisted(() => ({ createMany: vi.fn() }));

const userId = "11111111-1111-4111-8111-111111111111";
const transactionId = "22222222-2222-4222-8222-222222222222";
const path = `${userId}/${transactionId}/receipt.png`;
const input = { transactionId, storagePath: path, contentType: "image/png", byteSize: 100 };
const request = (body: unknown, authorization: string | null = "Bearer valid-token") => new Request("https://api.test/api/receipts/sign-upload", {
  method: "POST", headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) }, body: JSON.stringify(body),
});

let requests: { url: string; init: RequestInit | undefined }[];
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  vi.stubEnv("REVENUECAT_WEBHOOK_AUTHORIZATION", "test-webhook-secret");
  requests = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const target = String(url);
    requests.push({ url: target, init });
    if (target.includes("/auth/v1/user")) return Response.json({ id: userId, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" });
    if (target.includes("/rest/v1/financial_transactions")) return Response.json({ id: transactionId });
    if (target.includes("/storage/v1/object/upload/sign/receipts/")) return Response.json({ url: `/object/upload/sign/receipts/${path}?token=test-token` });
    throw new Error(`Unexpected external request: ${target}`);
  }));
  createMany.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("receipt upload boundary", () => {
  it("rejects unauthenticated callers before any privileged provider call", async () => {
    const { POST } = await import("../app/api/receipts/sign-upload/route.js");
    expect((await POST(request(input, null))).status).toBe(401);
    expect(requests).toEqual([]);
  });
  it("rejects an invalid provider-verified token", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ message: "invalid JWT" }, { status: 401 }));
    const { POST } = await import("../app/api/receipts/sign-upload/route.js");
    expect((await POST(request(input))).status).toBe(401);
  });
  it.each([
    ["foreign owner", { storagePath: `33333333-3333-4333-8333-333333333333/${transactionId}/receipt.png` }, 403],
    ["prefix collision", { storagePath: `${userId}aaa/${transactionId}/receipt.png` }, 403],
    ["traversal", { storagePath: `${userId}/${transactionId}/../receipt.png` }, 400],
    ["encoded traversal", { storagePath: `${userId}/${transactionId}/%2e%2e.png` }, 400],
    ["foreign transaction path", { storagePath: `${userId}/33333333-3333-4333-8333-333333333333/receipt.png` }, 403],
    ["unsupported MIME", { contentType: "image/svg+xml" }, 400],
    ["oversized", { byteSize: 10485761 }, 400],
    ["empty", { byteSize: 0 }, 400],
    ["fractional size", { byteSize: 0.5 }, 400],
    ["mismatched extension", { contentType: "application/pdf" }, 400],
    ["caller-controlled owner", { userId: "someone-else" }, 400],
  ])("rejects %s without requesting a storage token", async (_name, patch, status) => {
    const { POST } = await import("../app/api/receipts/sign-upload/route.js");
    expect((await POST(request({ ...input, ...patch }))).status).toBe(status);
    expect(requests.some(({ url }) => url.includes("/storage/"))).toBe(false);
  });
  it("rejects transactions the caller does not own even under their own storage prefix", async () => {
    const originalFetch = fetch;
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => url.includes("/rest/v1/") ? Response.json(null) : originalFetch(url, init));
    const { POST } = await import("../app/api/receipts/sign-upload/route.js");
    expect((await POST(request(input))).status).toBe(403);
    expect(requests.some(({ url }) => url.includes("/storage/"))).toBe(false);
  });
  it.each([ ["image/png", "png"], ["image/jpeg", "jpg"], ["application/pdf", "pdf"] ])("signs an owned %s at the 10 MiB boundary", async (contentType, extension) => {
    const { POST } = await import("../app/api/receipts/sign-upload/route.js");
    const response = await POST(request({ ...input, contentType, byteSize: 10485760, storagePath: path.replace(".png", `.${extension}`) }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ bucket: "receipts", token: "test-token" });
    const ownerQuery = requests.find(({ url }) => url.includes("/rest/v1/"))?.url ?? "";
    expect(ownerQuery).toContain(`user_id=eq.${userId}`);
    expect(ownerQuery).toContain(`id=eq.${transactionId}`);
    const signing = requests.find(({ url }) => url.includes("/storage/"));
    expect(JSON.parse(String(signing?.init?.body))).toMatchObject({});
    expect(JSON.stringify(body)).not.toContain("test-service-key");
  });
  it("returns a safe 503 when service configuration is absent", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { POST } = await import("../app/api/receipts/sign-upload/route.js");
    const response = await POST(request(input));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
  it.each([
    ["malformed JSON", "{", "application/json", 400],
    ["oversized JSON body", JSON.stringify({ extra: "x".repeat(4096) }), "application/json", 413],
    ["unsupported request content type", JSON.stringify(input), "text/plain", 415],
  ])("rejects %s before signing", async (_name, body, contentType, status) => {
    const { POST } = await import("../app/api/receipts/sign-upload/route.js");
    const response = await POST(new Request("https://api.test/api/receipts/sign-upload", {
      method: "POST", headers: { authorization: "Bearer valid-token", "content-type": contentType }, body,
    }));
    expect(response.status).toBe(status);
    expect(requests.some(({ url }) => url.includes("/storage/"))).toBe(false);
  });
});

describe("RevenueCat webhook boundary", () => {
  const event = { api_version: "1.0", event: { id: "event-1", type: "TEST", app_user_id: userId } };
  it("rejects missing or incorrect provider authorization before persistence", async () => {
    const { POST } = await import("../app/api/webhooks/revenuecat/route.js");
    for (const authorization of [null, "wrong-secret"]) expect((await POST(request(event, authorization))).status).toBe(401);
    expect(createMany).not.toHaveBeenCalled();
  });
  it("rejects malformed authenticated events", async () => {
    const { POST } = await import("../app/api/webhooks/revenuecat/route.js");
    expect((await POST(request({ event: { id: "" } }, "test-webhook-secret"))).status).toBe(400);
    expect(createMany).not.toHaveBeenCalled();
  });
  it("acknowledges duplicate event IDs using atomic insert-or-ignore persistence", async () => {
    createMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const { POST } = await import("../app/api/webhooks/revenuecat/route.js");
    const first = await POST(request(event, "test-webhook-secret"));
    const duplicate = await POST(request(event, "test-webhook-secret"));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ received: true, duplicate: false });
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toEqual({ received: true, duplicate: true });
    expect(createMany).toHaveBeenCalledWith({ data: { id: "event-1", eventType: "TEST", payload: event }, skipDuplicates: true });
  });
  it("returns retryable failure instead of acknowledging a lost event", async () => {
    createMany.mockRejectedValue(new Error("database-password-secret"));
    const { POST } = await import("../app/api/webhooks/revenuecat/route.js");
    const response = await POST(request(event, "test-webhook-secret"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("database-password-secret");
  });
  it("fails closed when provider authorization has not been configured", async () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTHORIZATION", "");
    const { POST } = await import("../app/api/webhooks/revenuecat/route.js");
    expect((await POST(request(event, null))).status).toBe(503);
    expect(createMany).not.toHaveBeenCalled();
  });
});

it("exposes a credential-free health check", async () => {
  const { GET } = await import("../app/api/health/route.js");
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
