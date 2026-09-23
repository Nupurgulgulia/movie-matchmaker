"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SwipeDeck } from "@/components/SwipeDeck";
import { getRole } from "@/lib/device";
import { seededShuffle } from "@/lib/shuffle";
import { useSession } from "@/lib/useSession";
import type { Partner, SwipeDirection, TitleCard } from "@/lib/types";

export default function SwipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession(params.id);
  const [role, setRoleState] = useState<Partner | null>(null);
  const [titles, setTitles] = useState<TitleCard[] | null>(null);
  const [loadedRound, setLoadedRound] = useState<number | null>(null);
  const [deckEmpty, setDeckEmpty] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoleState(getRole(params.id));
  }, [params.id]);

  // Navigate as soon as the shared session status moves on, regardless of
  // where this partner is in their own local deck. Deliberately depends on
  // session?.status (a primitive) rather than the whole session object,
  // which gets a new reference on every poll tick even when unchanged.
  useEffect(() => {
    if (!session) return;
    if (session.status === "matched") router.push(`/session/${params.id}/match`);
    if (session.status === "final_choice") router.push(`/session/${params.id}/final`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status, params.id, router]);

  // Fetch (or re-fetch) the pool whenever the session moves to a new round.
  useEffect(() => {
    if (!session || session.status !== "swiping") return;
    if (loadedRound === session.round) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeckEmpty(false);
    fetch(`/api/sessions/${params.id}/pool?round=${session.round}`)
      .then((r) => r.json())
      .then((data) => {
        setTitles(data.titles || []);
        setLoadedRound(session.round);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status, session?.round, loadedRound, params.id]);

  // Safety-net poll while this partner is waiting on the other to finish.
  useEffect(() => {
    if (deckEmpty && session?.status === "swiping") {
      pollRef.current = setInterval(() => {
        fetch(`/api/sessions/${params.id}/round-check`, { method: "POST" });
      }, 4000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [deckEmpty, session?.status, params.id]);

  async function handleSwipe(title: TitleCard, direction: SwipeDirection) {
    if (!role) return;
    const res = await fetch(`/api/sessions/${params.id}/swipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner: role, tmdb_id: title.tmdb_id, direction }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.status === "matched") router.push(`/session/${params.id}/match`);
  }

  if (!role || !session) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
      </main>
    );
  }

  if (session.status === "generating") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <h1 className="text-xl font-bold text-foreground">No match yet — trying a new pool</h1>
        <p className="text-sm text-muted">Claude is leaning into what you both liked in round 1.</p>
      </main>
    );
  }

  if (deckEmpty || !titles) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <h1 className="text-xl font-bold text-foreground">
          {titles ? "Waiting for your partner to finish swiping..." : "Loading your titles..."}
        </h1>
      </main>
    );
  }

  const shuffled = seededShuffle(titles, `${params.id}-${role}-${session.round}`);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Round {session.round}
        </span>
        <span className="text-xs text-muted">Swipe or tap to choose</span>
      </div>
      <SwipeDeck titles={shuffled} onSwipe={handleSwipe} onEmpty={() => setDeckEmpty(true)} />
    </main>
  );
}
