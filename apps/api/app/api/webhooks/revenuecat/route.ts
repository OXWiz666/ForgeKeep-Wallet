import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { serverEnv } from "../../../../src/server/env.js";
import { HttpError, errorResponse, json, readJson } from "../../../../src/server/http.js";
import { getPrisma } from "../../../../src/server/prisma.js";
import { entitlementFromRevenueCatEvent } from "../../../../src/entitlements.js";

export const runtime = "nodejs";
const eventSchema = z.object({
  api_version: z.string().min(1),
  event: z.object({ id: z.string().min(1).max(255), type: z.string().min(1).max(100) }).passthrough(),
}).passthrough();

export async function POST(request: Request): Promise<Response> {
  try {
    const expected = Buffer.from(serverEnv("REVENUECAT_WEBHOOK_AUTHORIZATION"));
    const actual = Buffer.from(request.headers.get("authorization") ?? "");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new HttpError(401, "Unauthorized");
    const parsed = eventSchema.safeParse(await readJson(request, 262144));
    if (!parsed.success) throw new HttpError(400, "Invalid webhook event");
    const payload = parsed.data;
    // This is durable ingestion only. Entitlement effects belong to the later processor.
    const result = await getPrisma().subscriptionEvent.createMany({
      data: { id: payload.event.id, eventType: payload.event.type, payload: JSON.parse(JSON.stringify(payload)) },
      skipDuplicates: true,
    });
    const snapshot = result.count === 1 ? entitlementFromRevenueCatEvent(payload.event) : null;
    if (snapshot) {
      await getPrisma().entitlement.upsert({ where: { userId: snapshot.userId }, create: { userId: snapshot.userId, entitlementId: snapshot.entitlementId, status: snapshot.status, expiresAt: snapshot.expiresAt, sourceEventId: snapshot.sourceEventId }, update: { entitlementId: snapshot.entitlementId, status: snapshot.status, expiresAt: snapshot.expiresAt, sourceEventId: snapshot.sourceEventId } });
    }
    return json({ received: true, duplicate: result.count === 0 });
  } catch (error) { return errorResponse(error); }
}
