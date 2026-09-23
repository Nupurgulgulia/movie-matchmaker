import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { tryAdvanceRound } from "@/lib/matching";
import type { Partner, SwipeDirection } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const partner: Partner = body.partner;
  const tmdbId: number = body.tmdb_id;
  const direction: SwipeDirection = body.direction;

  const supabase = supabaseServer();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });
  if (session.status !== "swiping") {
    return NextResponse.json({ status: session.status });
  }
  const round = session.round;

  await supabase
    .from("swipes")
    .upsert(
      { session_id: id, round, partner, tmdb_id: tmdbId, direction },
      { onConflict: "session_id,round,partner,tmdb_id" }
    );

  if (direction === "right") {
    const { data: rightSwipes } = await supabase
      .from("swipes")
      .select("partner")
      .eq("session_id", id)
      .eq("round", round)
      .eq("tmdb_id", tmdbId)
      .eq("direction", "right");
    const partners = new Set((rightSwipes || []).map((r) => r.partner));
    if (partners.has("a") && partners.has("b")) {
      const { data: claimed } = await supabase
        .from("sessions")
        .update({ status: "matched" })
        .eq("id", id)
        .eq("status", "swiping")
        .select("id");
      if (claimed && claimed.length) {
        await supabase.from("matches").upsert(
          { session_id: id, round, tmdb_id: tmdbId },
          { onConflict: "session_id,round" }
        );
      }
      return NextResponse.json({ status: "matched" });
    }
  }

  const { data: pool } = await supabase
    .from("title_pool")
    .select("tmdb_id")
    .eq("session_id", id)
    .eq("round", round);
  const poolSize = pool?.length || 0;

  const { count: myCount } = await supabase
    .from("swipes")
    .select("*", { count: "exact", head: true })
    .eq("session_id", id)
    .eq("round", round)
    .eq("partner", partner);

  const finishedField = partner === "a" ? "partner_a_finished_round" : "partner_b_finished_round";
  if ((myCount || 0) >= poolSize) {
    await supabase.from("sessions").update({ [finishedField]: true }).eq("id", id);
  }

  await tryAdvanceRound(supabase, id);

  return NextResponse.json({ status: "ok" });
}
