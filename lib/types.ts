export type Mood = "light_fun" | "intense_gripping" | "scary" | "romantic" | "other";

export type Language = "hindi" | "english" | "tamil" | "telugu" | "kannada" | "any";

export type ContentType = "movies" | "series";

export type MinRating = 6 | 7 | 8 | 9;

export type Era = "any" | "classic" | "mid" | "recent";

export type Partner = "a" | "b";

export type SessionStatus =
  | "collecting"
  | "swiping"
  | "generating"
  | "matched"
  | "final_choice"
  | "done";

export type SwipeDirection = "left" | "right";

export interface Preferences {
  moods: Mood[];
  mood_text: string;
  languages: Language[];
  content_type: ContentType;
  min_rating: MinRating;
  eras: Era[];
}

export interface PreferenceRow extends Preferences {
  session_id: string;
  partner: Partner;
  submitted_at: string;
}

export interface TitlePoolRow extends TitleCard {
  session_id: string;
  round: number;
}

export interface SwipeRow {
  session_id: string;
  round: number;
  partner: Partner;
  tmdb_id: number;
  direction: SwipeDirection;
}

export interface TitleCard {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  year: number | null;
  poster_path: string | null;
  rating: number | null;
  runtime: number | null;
  synopsis: string;
}

export interface SessionRow {
  id: string;
  couple_id: string;
  status: SessionStatus;
  round: number;
  partner_a_submitted: boolean;
  partner_b_submitted: boolean;
  partner_a_finished_round: boolean;
  partner_b_finished_round: boolean;
  final_choice_tmdb_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface OttOffer {
  service: string;
  link: string;
  logo?: string | null;
  type?: "sub" | "rent" | "buy" | "free" | string;
}

export const MOOD_LABELS: Record<Mood, string> = {
  light_fun: "Light & fun",
  intense_gripping: "Intense & gripping",
  scary: "Scary",
  romantic: "Romantic",
  other: "Other",
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  hindi: "Hindi",
  english: "English",
  tamil: "Tamil",
  telugu: "Telugu",
  kannada: "Kannada",
  any: "Any",
};

export const ERA_LABELS: Record<Era, string> = {
  any: "Any",
  classic: "Classic (pre-2000)",
  mid: "2000–2020",
  recent: "Recent (2021–2026)",
};
