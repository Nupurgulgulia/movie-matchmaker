import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const supabase = supabaseServer();

  const { error } = await supabase.from("ratings").upsert({
    session_id: id,
    tmdb_id: body.tmdb_id,
    rating: body.rating,
    notes: body.notes || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("sessions").update({ status: "done" }).eq("id", id);

  return NextResponse.json({ ok: true });
}
