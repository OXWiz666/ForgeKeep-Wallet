import "server-only";
import { z } from "zod";
import { HttpError } from "./http.js";
import { getSupabase } from "./supabase.js";

export type AuthenticatedContext = { userId: string; supabase: ReturnType<typeof getSupabase> };

// Called inside each protected handler; no caller-controlled identity headers are trusted.
export async function requireAuth(request: Request): Promise<AuthenticatedContext> {
  const token = /^Bearer ([^\s]+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) throw new HttpError(401, "Unauthorized");
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || !z.uuid().safeParse(data.user.id).success) throw new HttpError(401, "Unauthorized");
  return { userId: data.user.id, supabase };
}
