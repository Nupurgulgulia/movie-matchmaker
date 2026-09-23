import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { tryAdvanceRound } from "@/lib/matching";

// Safety-net poll: a partner's swipe screen calls this every few seconds
// while it's waiting for the other partner to finish the round, in case the
// swipe route's own trigger raced and missed the transition.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();
  await tryAdvanceRound(supabase, id);
  const { data } = await supabase.from("sessions").select("*").eq("id", id).single();
  return NextResponse.json({ session: data });
}
