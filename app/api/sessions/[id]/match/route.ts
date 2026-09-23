import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getIndianOttOffers } from "@/lib/ott";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const { data: session } = await supabase.from("sessions").select("*").eq("id", id).single();
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("session_id", id)
    .order("matched_at", { ascending: false })
    .limit(1);
  const match = matches?.[0];
  if (!match) return NextResponse.json({ match: null });

  const { data: title } = await supabase
    .from("title_pool")
    .select("*")
    .eq("session_id", id)
    .eq("round", match.round)
    .eq("tmdb_id", match.tmdb_id)
    .single();

  const offers = await getIndianOttOffers(match.tmdb_id, title.media_type);

  return NextResponse.json({ match: { title, offers } });
}
