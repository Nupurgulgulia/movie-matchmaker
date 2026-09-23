"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCoupleId, setCoupleId, setRole } from "@/lib/device";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // One-time client-only read of localStorage (unavailable during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHistory(!!getCoupleId());
  }, []);

  async function start() {
    setLoading(true);
    try {
      const coupleId = getCoupleId();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couple_id: coupleId || undefined }),
      });
      const data = await res.json();
      setCoupleId(data.couple_id);
      setRole(data.session_id, "a");
      router.push(`/session/${data.session_id}/preferences`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.35em] text-accent">tonight</span>
        <h1 className="max-w-sm text-4xl font-black leading-tight text-foreground">
          Stop scrolling.
          <br />
          Stop negotiating.
        </h1>
        <p className="max-w-xs text-sm text-muted">
          Set your mood, swipe with your partner, and land on something you&apos;ll both actually watch —
          with exactly where to stream it in India.
        </p>
      </div>

      <button
        onClick={start}
        disabled={loading}
        className="w-full max-w-xs rounded-full bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-accent-soft disabled:opacity-50"
      >
        {loading ? "Starting..." : "Start a movie night"}
      </button>

      {hasHistory && (
        <Link href="/history" className="text-sm font-medium text-muted underline underline-offset-4">
          See what you&apos;ve watched before
        </Link>
      )}
    </main>
  );
}
