import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "./env.js";

export function getSupabase() {
  return createClient(serverEnv("SUPABASE_URL"), serverEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
