import "server-only";
import type { ContentType, Language, TitleCard } from "./types";

const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const MOVIE_GENRES: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "science fiction": 878,
  "sci-fi": 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

const TV_GENRES: Record<string, number> = {
  "action & adventure": 10759,
  action: 10759,
  adventure: 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  kids: 10762,
  mystery: 9648,
  "sci-fi & fantasy": 10765,
  "science fiction": 10765,
  fantasy: 10765,
  soap: 10766,
  romance: 10766,
  "war & politics": 10768,
  war: 10768,
  western: 37,
};

const LANGUAGE_ISO: Record<Language, string | null> = {
  hindi: "hi",
  english: "en",
  tamil: "ta",
  telugu: "te",
  kannada: "kn",
  any: null,
};

export interface SearchBrief {
  movie_genres: string[];
  tv_genres: string[];
  year_from: number | null;
  year_to: number | null;
  min_rating: number;
  sort_by: "popularity.desc" | "vote_average.desc" | "vote_count.desc";
  tone_summary: string;
}

interface RawCandidate {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  year: number | null;
  poster_path: string | null;
  rating: number | null;
  synopsis: string;
  popularity: number;
  vote_count: number;
}

function genreIds(names: string[], map: Record<string, number>): number[] {
  const ids = new Set<number>();
  for (const n of names) {
    const id = map[n.trim().toLowerCase()];
    if (id) ids.add(id);
  }
  return [...ids];
}

async function tmdbFetch(path: string, params: Record<string, string | number | undefined>) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("Missing TMDB_API_KEY");
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

interface TmdbRawResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  overview?: string;
  popularity?: number;
  vote_count?: number;
}

function mapResult(r: TmdbRawResult, mediaType: "movie" | "tv"): RawCandidate | null {
  const title = mediaType === "movie" ? r.title : r.name;
  const dateStr = mediaType === "movie" ? r.release_date : r.first_air_date;
  if (!title) return null;
  return {
    tmdb_id: r.id,
    media_type: mediaType,
    title,
    year: dateStr ? Number(String(dateStr).slice(0, 4)) : null,
    poster_path: r.poster_path ? IMG_BASE + r.poster_path : null,
    rating: typeof r.vote_average === "number" ? Math.round(r.vote_average * 10) / 10 : null,
    synopsis: r.overview || "",
    popularity: r.popularity ?? 0,
    vote_count: r.vote_count ?? 0,
  };
}

async function discoverOne(
  mediaType: "movie" | "tv",
  brief: SearchBrief,
  languageIso: string | null,
  page: number
): Promise<RawCandidate[]> {
  const genreMap = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
  const genres = genreIds(mediaType === "movie" ? brief.movie_genres : brief.tv_genres, genreMap);
  const dateGteKey = mediaType === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
  const dateLteKey = mediaType === "movie" ? "primary_release_date.lte" : "first_air_date.lte";

  const params: Record<string, string | number | undefined> = {
    sort_by: brief.sort_by,
    "vote_average.gte": brief.min_rating,
    "vote_count.gte": 20,
    page,
    include_adult: "false",
    watch_region: "IN",
  };
  if (genres.length) params.with_genres = genres.join(",");
  if (languageIso) params.with_original_language = languageIso;
  if (brief.year_from) params[dateGteKey] = `${brief.year_from}-01-01`;
  if (brief.year_to) params[dateLteKey] = `${brief.year_to}-12-31`;

  const data = await tmdbFetch(`/discover/${mediaType}`, params);
  const results: TmdbRawResult[] = data.results || [];
  return results.map((r) => mapResult(r, mediaType)).filter(Boolean) as RawCandidate[];
}

export async function discoverCandidates(
  brief: SearchBrief,
  contentType: ContentType,
  languages: Language[]
): Promise<RawCandidate[]> {
  const mediaTypes: ("movie" | "tv")[] = contentType === "series" ? ["movie", "tv"] : ["movie"];
  const isoCodes = languages.includes("any")
    ? [null]
    : [...new Set(languages.map((l) => LANGUAGE_ISO[l]).filter((x): x is string => !!x))];
  const codes = isoCodes.length ? isoCodes : [null];

  const tasks: Promise<RawCandidate[]>[] = [];
  for (const mediaType of mediaTypes) {
    for (const iso of codes) {
      tasks.push(discoverOne(mediaType, brief, iso, 1));
      tasks.push(discoverOne(mediaType, brief, iso, 2));
    }
  }

  const settled = await Promise.allSettled(tasks);
  const all: RawCandidate[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") all.push(...s.value);
  }

  const seen = new Set<string>();
  const deduped = all.filter((c) => {
    const key = `${c.media_type}:${c.tmdb_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => b.popularity - a.popularity);
  return deduped;
}

export async function resolveImdbId(tmdbId: number, mediaType: "movie" | "tv"): Promise<string | null> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${tmdbId}/external_ids`, {});
    return data.imdb_id || null;
  } catch {
    return null;
  }
}

async function fetchRuntime(candidate: RawCandidate): Promise<number | null> {
  try {
    const data = await tmdbFetch(`/${candidate.media_type}/${candidate.tmdb_id}`, {});
    if (candidate.media_type === "movie") return data.runtime ?? null;
    const arr: number[] = data.episode_run_time || [];
    return arr.length ? arr[0] : null;
  } catch {
    return null;
  }
}

export async function hydratePool(
  candidates: RawCandidate[],
  count: number,
  excludeKeys: Set<string> = new Set()
): Promise<TitleCard[]> {
  const filtered = candidates.filter((c) => !excludeKeys.has(`${c.media_type}:${c.tmdb_id}`));
  const chosen = filtered.slice(0, count);
  const runtimes = await Promise.all(chosen.map(fetchRuntime));
  return chosen.map((c, i) => ({
    tmdb_id: c.tmdb_id,
    media_type: c.media_type,
    title: c.title,
    year: c.year,
    poster_path: c.poster_path,
    rating: c.rating,
    runtime: runtimes[i],
    synopsis: c.synopsis,
  }));
}
