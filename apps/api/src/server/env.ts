import "server-only";
import { z } from "zod";
import { HttpError } from "./http.js";

export function serverEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "DATABASE_URL" | "REVENUECAT_WEBHOOK_AUTHORIZATION"): string {
  const schema = name.endsWith("URL") ? z.url() : z.string().min(1);
  const parsed = schema.safeParse(process.env[name]);
  if (!parsed.success) throw new HttpError(503, "Service unavailable");
  return parsed.data;
}
