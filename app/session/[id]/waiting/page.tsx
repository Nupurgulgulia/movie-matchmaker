"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QrShare } from "@/components/QrShare";
import { getCoupleId } from "@/lib/device";
import { useSession } from "@/lib/useSession";

export default function WaitingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession(params.id);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  useEffect(() => {
    const coupleId = getCoupleId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinUrl(`${window.location.origin}/join/${params.id}${coupleId ? `?c=${coupleId}` : ""}`);
  }, [params.id]);

  useEffect(() => {
    if (session?.status === "swiping") {
      router.push(`/session/${params.id}/swipe`);
    }
  }, [session?.status, params.id, router]);

  const bothSubmitted = session?.partner_a_submitted && session?.partner_b_submitted;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      {bothSubmitted ? (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
          <h1 className="text-xl font-bold text-foreground">Finding titles for both of you...</h1>
          <p className="text-sm text-muted">Claude is merging your moods and pulling a pool from TMDB.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-foreground">You&apos;re in. Now get your partner.</h1>
            <p className="text-sm text-muted">
              Have them scan this QR code, or send them the link — they&apos;ll land in this same session.
            </p>
          </div>
          {joinUrl && <QrShare url={joinUrl} />}
        </>
      )}
    </main>
  );
}
