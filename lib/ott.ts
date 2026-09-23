import "server-only";
import type { OttOffer } from "./types";
import { resolveImdbId } from "./tmdb";

// RapidAPI "OTT Details" product (ott-details.p.rapidapi.com). Confirmed via
// live calls: GET /search?title=<text> returns { page, results: [{ imdbid,
// title, released, type, genre, synopsis, imageurl }] } — no streaming data.
// The actual per-title streaming-platform endpoint ("Title Details" per the
// product listing) could not be reverse-engineered from outside docs; every
// guessed path (title, details, titleinfo, titledetails, ott, streaming,
// watch, info, movie, id, imdb, hyphenated/camelCase variants) returned 404.
// FETCH_PATH below is a placeholder — replace it with the exact path shown
// in RapidAPI's "Code Snippets" panel for that endpoint, keeping the
// response-mapping logic beneath it.
const FETCH_PATH: string | null = null; // e.g. "titledetails" — set once confirmed

interface OttDetailsStreamingEntry {
  service?: string;
  platform?: string;
  name?: string;
  link?: string;
  url?: string;
  type?: string;
}

interface OttDetailsResponse {
  streamingInfo?: Record<string, OttDetailsStreamingEntry[]>;
  streaming?: OttDetailsStreamingEntry[];
}

export async function getIndianOttOffers(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<OttOffer[]> {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST;
  if (!key || !host || !FETCH_PATH) return [];

  const imdbId = await resolveImdbId(tmdbId, mediaType);
  if (!imdbId) return [];

  try {
    const url = `https://${host}/${FETCH_PATH}?imdbid=${imdbId}`;
    const res = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data: OttDetailsResponse = await res.json();

    const entries = data.streamingInfo?.in || data.streamingInfo?.IN || data.streaming || [];
    const offers: OttOffer[] = entries
      .map((e) => ({
        service: e.service || e.platform || e.name || "Unknown",
        link: e.link || e.url || "",
        type: e.type,
      }))
      .filter((o) => o.link);

    const seen = new Set<string>();
    return offers.filter((o) => {
      if (seen.has(o.service)) return false;
      seen.add(o.service);
      return true;
    });
  } catch {
    return [];
  }
}
