import { receiptUploadSchema } from "@forgekeep/validators";
import { requireAuth } from "../../../../src/server/auth.js";
import { HttpError, errorResponse, json, readJson } from "../../../../src/server/http.js";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const { userId, supabase } = await requireAuth(request);
    const parsed = receiptUploadSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success) throw new HttpError(400, "Invalid receipt upload");
    const { transactionId, storagePath } = parsed.data;
    const [owner, transaction] = storagePath.split("/");
    if (owner !== userId || transaction !== transactionId) throw new HttpError(403, "Forbidden");
    const { data: owned, error: lookupError } = await supabase.from("financial_transactions")
      .select("id").eq("id", transactionId).eq("user_id", userId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!owned) throw new HttpError(403, "Forbidden");
    // Bucket-level MIME/10 MiB limits are essential: upload tokens do not bind these fields.
    const { data, error } = await supabase.storage.from("receipts").createSignedUploadUrl(storagePath, { upsert: false });
    if (error || !data) throw error ?? new Error("Signing failed");
    return json({ bucket: "receipts", storagePath, signedUrl: data.signedUrl, token: data.token });
  } catch (error) { return errorResponse(error); }
}
