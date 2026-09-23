import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = supabaseServer();

  let coupleId: string = body.couple_id;
  if (!coupleId) {
    const { data, error } = await supabase.from("couples").insert({}).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    coupleId = data.id;
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({ couple_id: coupleId })
    .select("id")
    .single();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  return NextResponse.json({ session_id: session.id, couple_id: coupleId });
}
