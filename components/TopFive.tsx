"use client";

import type { OttOffer, TitleCard } from "@/lib/types";

export interface TopFiveEntry {
  title: TitleCard;
  score: number;
  offers: OttOffer[];
}

export function TopFive({
  entries,
  onPick,
  picking,
}: {
  entries: TopFiveEntry[];
  onPick: (tmdbId: number) => void;
  picking: number | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">No match yet — you pick together</h1>
        <p className="text-sm text-muted">
          These are the titles you both responded to the most. Decide together and tap one.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {entries.map((e) => (
          <div
            key={e.title.tmdb_id}
            className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-3"
          >
            {e.title.poster_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={e.title.poster_path}
                alt={e.title.title}
                className="h-32 w-24 flex-shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="flex flex-1 flex-col justify-between gap-2 py-1">
              <div>
                <h3 className="font-bold text-foreground">{e.title.title}</h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  {e.title.year && <span>{e.title.year}</span>}
                  {e.title.rating != null && <span className="text-gold">★ {e.title.rating.toFixed(1)}</span>}
                  {e.title.runtime && <span>{e.title.runtime} min</span>}
                </div>
                {e.offers.length > 0 && (
                  <p className="mt-1 truncate text-xs text-muted">On {e.offers.map((o) => o.service).join(", ")}</p>
                )}
              </div>
              <button
                onClick={() => onPick(e.title.tmdb_id)}
                disabled={picking !== null}
                className="self-start rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                {picking === e.title.tmdb_id ? "Picking..." : "Let's watch this"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
