"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCoupleId } from "@/lib/device";
import type { TitleCard } from "@/lib/types";

interface HistoryEntry {
  session: { id: string; status: string; created_at: string };
  title: TitleCard | null;
  rating: number | null;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    const coupleId = getCoupleId();
    if (!coupleId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries([]);
      return;
    }
    fetch(`/api/history?couple_id=${coupleId}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.sessions || []));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your movie nights</h1>
        <Link href="/" className="text-sm font-medium text-accent">
          New night
        </Link>
      </div>

      {entries === null && (
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      )}

      {entries?.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">
          No history yet — start a movie night to begin building it.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {entries?.map((e) => (
          <div key={e.session.id} className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
            {e.title?.poster_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.title.poster_path} alt={e.title.title} className="h-24 w-16 rounded-lg object-cover" />
            )}
            <div className="flex flex-1 flex-col justify-center gap-1">
              <p className="font-semibold text-foreground">{e.title?.title || "No match reached"}</p>
              <p className="text-xs text-muted">{new Date(e.session.created_at).toLocaleDateString("en-IN")}</p>
              {e.rating && (
                <p className="text-xs text-gold">{"★".repeat(e.rating)}{"☆".repeat(5 - e.rating)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
