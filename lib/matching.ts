import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRound2Pool, writePool } from "./pool";
import type { PreferenceRow, SwipeRow, TitleCard, TitlePoolRow } from "./types";

function toTitleCard(row: TitlePoolRow): TitleCard {
  return {
    tmdb_id: row.tmdb_id,
    media_type: row.media_type,
    title: row.title,
    year: row.year,
    poster_path: row.poster_path,
    rating: row.rating,
    runtime: row.runtime,
    synopsis: row.synopsis,
  };
}

// Idempotent: safe to call repeatedly (e.g. from a polling endpoint as a
// safety net alongside the swipe route's own trigger). Only one caller will
// win the atomic status claim below; everyone else is a no-op.
export async function tryAdvanceRound(supabase: SupabaseClient, sessionId: string) {
  const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
  if (!session || session.status !== "swiping") return;
  if (!session.partner_a_finished_round || !session.partner_b_finished_round) return;

  const round = session.round;
  const { data: claimed } = await supabase
    .from("sessions")
    .update({ status: "generating" })
    .eq("id", sessionId)
    .eq("status", "swiping")
    .eq("round", round)
    .select("id");
  if (!claimed || !claimed.length) return;

  if (round === 1) {
    const { data: prefRows } = await supabase.from("preferences").select("*").eq("session_id", sessionId);
    const prefs = (prefRows || []) as PreferenceRow[];
    const prefA = prefs.find((r) => r.partner === "a")!;
    const prefB = prefs.find((r) => r.partner === "b")!;

    const { data: round1Rows } = await supabase
      .from("title_pool")
      .select("*")
      .eq("session_id", sessionId)
      .eq("round", 1);
    const round1Titles = ((round1Rows || []) as TitlePoolRow[]).map(toTitleCard);

    const { data: rightRows } = await supabase
      .from("swipes")
      .select("partner, tmdb_id")
      .eq("session_id", sessionId)
      .eq("round", 1)
      .eq("direction", "right");
    const rightSwipes = (rightRows || []) as Pick<SwipeRow, "partner" | "tmdb_id">[];
    const byId = new Map(round1Titles.map((t) => [t.tmdb_id, t]));
    const rightA = rightSwipes
      .filter((r) => r.partner === "a")
      .map((r) => byId.get(r.tmdb_id))
      .filter((t): t is TitleCard => !!t);
    const rightB = rightSwipes
      .filter((r) => r.partner === "b")
      .map((r) => byId.get(r.tmdb_id))
      .filter((t): t is TitleCard => !!t);

    const round2Titles = await generateRound2Pool(prefA, prefB, rightA, rightB, round1Titles);
    await writePool(supabase, sessionId, 2, round2Titles);

    await supabase
      .from("sessions")
      .update({
        round: 2,
        status: "swiping",
        partner_a_finished_round: false,
        partner_b_finished_round: false,
      })
      .eq("id", sessionId);
  } else {
    await supabase.from("sessions").update({ status: "final_choice" }).eq("id", sessionId);
  }
}
