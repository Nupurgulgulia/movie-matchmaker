"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "./supabase-browser";
import type { SessionRow } from "./types";

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<SessionRow | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSession(data.session);
    } catch {
      // transient network error — the next poll tick will retry
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();

    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          if (active) setSession(payload.new as SessionRow);
        }
      )
      .subscribe();

    const interval = setInterval(refresh, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [sessionId, refresh]);

  return { session, refresh };
}
