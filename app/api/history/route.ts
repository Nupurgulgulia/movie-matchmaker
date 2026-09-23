import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const coupleId = req.nextUrl.searchParams.get("couple_id");
  if (!coupleId) return NextResponse.json({ error: "missing couple_id" }, { status: 400 });
  const supabase = supabaseServer();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (!sessions?.length) return NextResponse.json({ sessions: [] });

  const sessionIds = sessions.map((s) => s.id);
  const { data: matches } = await supabase.from("matches").select("*").in("session_id", sessionIds);
  const { data: ratings } = await supabase.from("ratings").select("*").in("session_id", sessionIds);
  const { data: pool } = await supabase.from("title_pool").select("*").in("session_id", sessionIds);
  const poolMap = new Map(pool?.map((p) => [`${p.session_id}:${p.round}:${p.tmdb_id}`, p]));

  const result = sessions.map((s) => {
    const match = matches?.find((m) => m.session_id === s.id);
    const title = match ? poolMap.get(`${s.id}:${match.round}:${match.tmdb_id}`) : null;
    const rating = title ? ratings?.find((r) => r.session_id === s.id && r.tmdb_id === title.tmdb_id) : null;
    return { session: s, title: title || null, rating: rating?.rating ?? null, notes: rating?.notes ?? null };
  });

  return NextResponse.json({ sessions: result });
}
