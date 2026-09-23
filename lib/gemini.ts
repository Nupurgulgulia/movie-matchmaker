import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import type { Preferences, TitleCard } from "./types";
import type { SearchBrief } from "./tmdb";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

const BRIEF_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    movie_genres: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "TMDB movie genre names to search (e.g. Comedy, Thriller, Romance, Horror, Drama, Action, Sci-Fi).",
    },
    tv_genres: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "TMDB tv genre names to search, same vocabulary as movie_genres.",
    },
    year_from: { type: Type.INTEGER, nullable: true, description: "Earliest release year to include, or null for no floor." },
    year_to: { type: Type.INTEGER, nullable: true, description: "Latest release year to include, or null for no ceiling." },
    min_rating: { type: Type.NUMBER, description: "Minimum vote average to enforce (mirrors the stricter of the two partners' minimums)." },
    sort_by: {
      type: Type.STRING,
      enum: ["popularity.desc", "vote_average.desc", "vote_count.desc"],
      description: "How TMDB should rank/prioritize results before we trim to a pool.",
    },
    tone_summary: {
      type: Type.STRING,
      description: "One short sentence describing the merged mood/tone for these two people tonight.",
    },
  },
  required: ["movie_genres", "tv_genres", "year_from", "year_to", "min_rating", "sort_by", "tone_summary"],
};

function prefsBlock(label: string, p: Preferences): string {
  return [
    `${label}:`,
    `  moods: ${p.moods.join(", ") || "(none selected)"}`,
    `  free-text mood: ${p.mood_text ? `"${p.mood_text}"` : "(none)"}`,
    `  languages: ${p.languages.join(", ")}`,
    `  content type: ${p.content_type}`,
    `  minimum rating: ${p.min_rating}+`,
    `  eras: ${p.eras.join(", ")}`,
  ].join("\n");
}

async function callForBrief(prompt: string): Promise<SearchBrief> {
  const response = await client().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: BRIEF_SCHEMA,
    },
  });
  const text = response.text;
  if (!text) throw new Error("Gemini did not return a search brief");
  return JSON.parse(text) as SearchBrief;
}

export async function buildSearchBrief(
  prefsA: Preferences,
  prefsB: Preferences,
  historyDigest?: string
): Promise<SearchBrief> {
  const strictestRating = Math.max(prefsA.min_rating, prefsB.min_rating);
  const prompt = `Two partners are picking something to watch together tonight in India. Merge their preferences into one search brief for querying TMDB. Find genuine overlap in mood and taste rather than just averaging — if their moods conflict, look for a middle ground (e.g. one wants scary, one wants light & fun -> a fun horror-comedy or a gripping-but-not-grim thriller could work) and explain your read of it in tone_summary.

${prefsBlock("Partner A", prefsA)}

${prefsBlock("Partner B", prefsB)}

${historyDigest ? `What this couple has enjoyed together before (use this to lean into their actual taste, not just the abstract prefs):\n${historyDigest}\n` : ""}
Use minimum rating ${strictestRating}+ (the stricter of the two). Respect both language sets combined (if either says "Any", treat language as open). Respect both era selections combined (if either says "Any", treat era as open — set year_from/year_to to null). Weigh the free-text mood descriptions heavily; they're the most specific signal either partner gave.`;

  return callForBrief(prompt);
}

export async function refineForRound2(
  prefsA: Preferences,
  prefsB: Preferences,
  rightSwipesA: TitleCard[],
  rightSwipesB: TitleCard[]
): Promise<SearchBrief> {
  const describeSwipes = (label: string, titles: TitleCard[]) =>
    titles.length
      ? `${label} swiped right on: ${titles.map((t) => `${t.title} (${t.year ?? "?"})`).join(", ")}`
      : `${label} swiped right on nothing this round.`;

  const prompt = `Round 1 of a couple's movie-night swipe deck ended with no shared match. Build a new search brief for round 2 that leans into what each partner actually responded to, not just their original stated preferences.

${prefsBlock("Partner A original preferences", prefsA)}

${prefsBlock("Partner B original preferences", prefsB)}

${describeSwipes("Partner A", rightSwipesA)}
${describeSwipes("Partner B", rightSwipesB)}

Infer the genres/tone that both partners' right-swipes have in common, and bias the brief toward that overlap while staying within their stated language/era/rating constraints. If one partner right-swiped much more than the other, weight toward the genres that both of them touched at least once.`;

  return callForBrief(prompt);
}

export function buildHistoryDigest(
  liked: { title: string; year: number | null }[]
): string | undefined {
  if (!liked.length) return undefined;
  return liked
    .slice(0, 15)
    .map((t) => `${t.title}${t.year ? ` (${t.year})` : ""}`)
    .join(", ");
}
