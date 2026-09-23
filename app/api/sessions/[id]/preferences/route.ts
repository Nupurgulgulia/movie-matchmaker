import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { generateRound1Pool, writePool } from "@/lib/pool";
import { getHistoryDigest } from "@/lib/history";
import type { Partner, PreferenceRow, Preferences } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const partner: Partner = body.partner;
  const preferences: Preferences = body.preferences;
  if (partner !== "a" && partner !== "b") {
    return NextResponse.json({ error: "invalid partner" }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { error: upsertError } = await supabase.from("preferences").upsert({
    session_id: id,
    partner,
    moods: preferences.moods,
    mood_text: preferences.mood_text,
    languages: preferences.languages,
    content_type: preferences.content_type,
    min_rating: preferences.min_rating,
    eras: preferences.eras,
  });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  const submittedField = partner === "a" ? "partner_a_submitted" : "partner_b_submitted";
  const { data: session, error: sessionFetchError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (sessionFetchError) return NextResponse.json({ error: sessionFetchError.message }, { status: 500 });

  await supabase.from("sessions").update({ [submittedField]: true }).eq("id", id);

  const otherSubmitted = partner === "a" ? session.partner_b_submitted : session.partner_a_submitted;
  if (!otherSubmitted) {
    return NextResponse.json({ ready: false });
  }

  // Both partners have now submitted — generate the round 1 pool.
  const { data, error: prefsError } = await supabase.from("preferences").select("*").eq("session_id", id);
  if (prefsError) return NextResponse.json({ error: prefsError.message }, { status: 500 });
  const prefRows = data as PreferenceRow[];

  const prefA = prefRows.find((r) => r.partner === "a");
  const prefB = prefRows.find((r) => r.partner === "b");
  if (!prefA || !prefB) {
    return NextResponse.json({ error: "missing preferences" }, { status: 500 });
  }

  const historyDigest = await getHistoryDigest(supabase, session.couple_id, id);
  const titles = await generateRound1Pool(prefA, prefB, historyDigest);
  await writePool(supabase, id, 1, titles);

  const { error: statusError } = await supabase
    .from("sessions")
    .update({ status: "swiping", round: 1 })
    .eq("id", id);
  if (statusError) return NextResponse.json({ error: statusError.message }, { status: 500 });

  return NextResponse.json({ ready: true });
}
