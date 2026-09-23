"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopFive, type TopFiveEntry } from "@/components/TopFive";
import { useSession } from "@/lib/useSession";

export default function FinalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession(params.id);
  const [entries, setEntries] = useState<TopFiveEntry[] | null>(null);
  const [picking, setPicking] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${params.id}/final`)
      .then((r) => r.json())
      .then((d) => setEntries(d.top || []));
  }, [params.id]);

  useEffect(() => {
    if (session?.status === "matched") router.push(`/session/${params.id}/match`);
  }, [session?.status, params.id, router]);

  async function pick(tmdbId: number) {
    setPicking(tmdbId);
    const res = await fetch(`/api/sessions/${params.id}/final`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id: tmdbId }),
    });
    if (res.ok) router.push(`/session/${params.id}/match`);
    else setPicking(null);
  }

  if (!entries) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <TopFive entries={entries} onPick={pick} picking={picking} />
    </main>
  );
}
