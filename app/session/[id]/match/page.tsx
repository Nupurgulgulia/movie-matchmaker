"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MatchReveal } from "@/components/MatchReveal";
import type { OttOffer, TitleCard } from "@/lib/types";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ title: TitleCard; offers: OttOffer[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [rated, setRated] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${params.id}/match`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.match) {
          router.replace(`/session/${params.id}/final`);
          return;
        }
        setData(d.match);
        setLoading(false);
      });
  }, [params.id, router]);

  async function submitRating() {
    if (!rating || !data) return;
    setSubmittingRating(true);
    await fetch(`/api/sessions/${params.id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id: data.title.tmdb_id, rating }),
    });
    setRated(true);
    setSubmittingRating(false);
  }

  if (loading || !data) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 px-6 py-10">
      <MatchReveal title={data.title} offers={data.offers} />

      <div className="flex flex-col items-center gap-3 border-t border-border pt-6">
        {rated ? (
          <p className="text-sm text-muted">Thanks — saved for next time.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">Watched it? Rate it for next time.</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl ${rating && n <= rating ? "text-gold" : "text-border"}`}
                  aria-label={`${n} star`}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              onClick={submitRating}
              disabled={!rating || submittingRating}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submittingRating ? "Saving..." : "Save rating"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
