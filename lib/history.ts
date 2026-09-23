import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHistoryDigest } from "./gemini";

export async function getHistoryDigest(
  supabase: SupabaseClient,
  coupleId: string,
  excludeSessionId: string
): Promise<string | undefined> {
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("couple_id", coupleId)
    .neq("id", excludeSessionId)
    .eq("status", "done");
  const sessionIds = (sessions || []).map((s) => s.id);
  if (!sessionIds.length) return undefined;

  const { data: matches } = await supabase
    .from("matches")
    .select("session_id, tmdb_id")
    .in("session_id", sessionIds);
  if (!matches?.length) return undefined;

  const { data: ratings } = await supabase
    .from("ratings")
    .select("session_id, tmdb_id, rating")
    .in("session_id", sessionIds);
  const ratingMap = new Map((ratings || []).map((r) => [`${r.session_id}:${r.tmdb_id}`, r.rating]));

  const { data: pool } = await supabase
    .from("title_pool")
    .select("session_id, tmdb_id, title, year")
    .in("session_id", sessionIds);
  const poolMap = new Map((pool || []).map((p) => [`${p.session_id}:${p.tmdb_id}`, p]));

  const liked = matches
    .map((m) => {
      const key = `${m.session_id}:${m.tmdb_id}`;
      const title = poolMap.get(key);
      const rating = ratingMap.get(key) ?? null;
      return title ? { title: title.title, year: title.year, rating } : null;
    })
    .filter((x): x is { title: string; year: number | null; rating: number | null } => !!x)
    .sort((a, b) => (b.rating ?? 3) - (a.rating ?? 3));

  return buildHistoryDigest(liked);
}
