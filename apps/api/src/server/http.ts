import "server-only";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function readJson(request: Request, limit: number): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") throw new HttpError(415, "Expected JSON");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "Request too large");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Invalid JSON");
  } finally { reader.releaseLock(); }
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(error: unknown): Response {
  return error instanceof HttpError ? json({ error: error.message }, error.status)
    : json({ error: "Service unavailable" }, 503);
}
