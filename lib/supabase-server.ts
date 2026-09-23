import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: server-only, bypasses RLS. Never import this from a
// client component or expose the key to the browser.
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase server env vars");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
