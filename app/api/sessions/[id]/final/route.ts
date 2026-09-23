import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getIndianOttOffers } from "@/lib/ott";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const { data: session } = await supabase.from("sessions").select("*").eq("id", id).single();
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: rightSwipes } = await supabase
    .from("swipes")
    .select("round, partner, tmdb_id")
    .eq("session_id", id)
    .eq("direction", "right")
    .in("round", [1, 2]);

  const { data: poolRows } = await supabase
    .from("title_pool")
    .select("*")
    .eq("session_id", id)
    .in("round", [1, 2]);
  const byId = new Map(poolRows?.map((p) => [p.tmdb_id, p]));

  const scoreByTitle = new Map<number, number>();
  for (const s of rightSwipes || []) {
    scoreByTitle.set(s.tmdb_id, (scoreByTitle.get(s.tmdb_id) || 0) + 1);
  }

  const ranked = [...scoreByTitle.entries()]
    .map(([tmdbId, score]) => ({ title: byId.get(tmdbId), score }))
    .filter((r) => !!r.title)
    .sort((a, b) => b.score - a.score || (b.title!.rating || 0) - (a.title!.rating || 0))
    .slice(0, 5);

  const withOffers = await Promise.all(
    ranked.map(async (r) => ({
      title: r.title,
      score: r.score,
      offers: await getIndianOttOffers(r.title!.tmdb_id, r.title!.media_type),
    }))
  );

  return NextResponse.json({ top: withOffers, final_choice_tmdb_id: session.final_choice_tmdb_id });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const supabase = supabaseServer();

  const { data: session } = await supabase.from("sessions").select("*").eq("id", id).single();
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: title } = await supabase
    .from("title_pool")
    .select("*")
    .eq("session_id", id)
    .eq("tmdb_id", body.tmdb_id)
    .in("round", [1, 2])
    .limit(1)
    .single();

  await supabase
    .from("matches")
    .upsert({ session_id: id, round: title.round, tmdb_id: body.tmdb_id }, { onConflict: "session_id,round" });

  await supabase
    .from("sessions")
    .update({ final_choice_tmdb_id: body.tmdb_id, status: "matched" })
    .eq("id", id);

  return NextResponse.json({ ok: true, title });
}
