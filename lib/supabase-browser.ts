"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Anon-key client for the browser: read-only selects (RLS is permissive for
// select) plus Realtime subscriptions. All writes go through /api routes.
export function supabaseBrowser(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  client = createClient(url, key);
  return client;
}
