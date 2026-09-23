"use client";

import { useState } from "react";
import type { ContentType, Era, Language, MinRating, Mood, Preferences } from "@/lib/types";
import { ERA_LABELS, LANGUAGE_LABELS, MOOD_LABELS } from "@/lib/types";

const MOODS: Mood[] = ["light_fun", "intense_gripping", "scary", "romantic", "other"];
const LANGUAGES: Language[] = ["hindi", "english", "tamil", "telugu", "kannada", "any"];
const ERAS: Era[] = ["any", "classic", "mid", "recent"];
const RATINGS: MinRating[] = [6, 7, 8, 9];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function toggleAnyAware<T extends string>(current: T[], value: T, anyValue: T): T[] {
  if (value === anyValue) return [anyValue];
  const withoutAny = current.filter((v) => v !== anyValue);
  if (withoutAny.includes(value)) {
    return withoutAny.filter((v) => v !== value);
  }
  return [...withoutAny, value];
}

export function PreferencesForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (prefs: Preferences) => void;
  submitting: boolean;
}) {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [moodText, setMoodText] = useState("");
  const [languages, setLanguages] = useState<Language[]>(["any"]);
  const [contentType, setContentType] = useState<ContentType>("movies");
  const [minRating, setMinRating] = useState<MinRating>(7);
  const [eras, setEras] = useState<Era[]>(["any"]);

  const canSubmit = moods.length > 0;

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          moods,
          mood_text: moodText.trim(),
          languages,
          content_type: contentType,
          min_rating: minRating,
          eras,
        });
      }}
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Mood</h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip
              key={m}
              active={moods.includes(m)}
              onClick={() => setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))}
            >
              {MOOD_LABELS[m]}
            </Chip>
          ))}
        </div>
        <textarea
          value={moodText}
          onChange={(e) => setMoodText(e.target.value)}
          placeholder="Describe what you're in the mood for tonight (optional)"
          rows={2}
          className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Language</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Chip
              key={l}
              active={languages.includes(l)}
              onClick={() => setLanguages((prev) => toggleAnyAware(prev, l, "any"))}
            >
              {LANGUAGE_LABELS[l]}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Content type</h2>
        <div className="flex gap-2">
          <Chip active={contentType === "movies"} onClick={() => setContentType("movies")}>
            Movies only
          </Chip>
          <Chip active={contentType === "series"} onClick={() => setContentType("series")}>
            Include series
          </Chip>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Minimum IMDb rating</h2>
        <div className="flex flex-wrap items-center gap-2">
          {RATINGS.map((r) => (
            <Chip key={r} active={minRating === r} onClick={() => setMinRating(r)}>
              {r}+
            </Chip>
          ))}
          {minRating === 9 && <span className="text-xs text-muted">very few titles</span>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Era</h2>
        <div className="flex flex-wrap gap-2">
          {ERAS.map((e) => (
            <Chip key={e} active={eras.includes(e)} onClick={() => setEras((prev) => toggleAnyAware(prev, e, "any"))}>
              {ERA_LABELS[e]}
            </Chip>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {submitting ? "Saving..." : "Continue"}
      </button>
      {!canSubmit && <p className="text-center text-xs text-muted">Pick at least one mood to continue.</p>}
    </form>
  );
}
