import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Preferences, TitleCard } from "./types";
import { discoverCandidates, hydratePool } from "./tmdb";
import { buildSearchBrief, refineForRound2 } from "./gemini";

const POOL_SIZE = 30;

export async function writePool(
  supabase: SupabaseClient,
  sessionId: string,
  round: number,
  titles: TitleCard[]
) {
  if (!titles.length) return;
  const rows = titles.map((t) => ({
    session_id: sessionId,
    round,
    tmdb_id: t.tmdb_id,
    media_type: t.media_type,
    title: t.title,
    year: t.year,
    poster_path: t.poster_path,
    rating: t.rating,
    runtime: t.runtime,
    synopsis: t.synopsis,
  }));
  const { error } = await supabase.from("title_pool").insert(rows);
  if (error) throw error;
}

export async function generateRound1Pool(
  prefsA: Preferences,
  prefsB: Preferences,
  historyDigest?: string
): Promise<TitleCard[]> {
  const contentType = prefsA.content_type === "series" || prefsB.content_type === "series" ? "series" : "movies";
  const languages = [...new Set([...prefsA.languages, ...prefsB.languages])];
  const brief = await buildSearchBrief(prefsA, prefsB, historyDigest);
  const candidates = await discoverCandidates(brief, contentType, languages);
  return hydratePool(candidates, POOL_SIZE);
}

export async function generateRound2Pool(
  prefsA: Preferences,
  prefsB: Preferences,
  rightSwipesA: TitleCard[],
  rightSwipesB: TitleCard[],
  round1Titles: TitleCard[]
): Promise<TitleCard[]> {
  const contentType = prefsA.content_type === "series" || prefsB.content_type === "series" ? "series" : "movies";
  const languages = [...new Set([...prefsA.languages, ...prefsB.languages])];
  const brief = await refineForRound2(prefsA, prefsB, rightSwipesA, rightSwipesB);
  const candidates = await discoverCandidates(brief, contentType, languages);
  const exclude = new Set(round1Titles.map((t) => `${t.media_type}:${t.tmdb_id}`));
  return hydratePool(candidates, POOL_SIZE, exclude);
}
