import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = Number(req.nextUrl.searchParams.get("round") || "1");
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("title_pool")
    .select("*")
    .eq("session_id", id)
    .eq("round", round);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ titles: data });
}
