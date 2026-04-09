import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("closed_weekdays")
    .select("day_of_week")
    .order("day_of_week");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r: any) => r.day_of_week));
}

export async function POST(req: NextRequest) {
  const { day_of_week } = await req.json();
  if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
    return NextResponse.json({ error: "day_of_week must be 0–6" }, { status: 400 });
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("closed_weekdays").upsert({ day_of_week });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { day_of_week } = await req.json();
  const supabase = getSupabase();
  const { error } = await supabase.from("closed_weekdays").delete().eq("day_of_week", day_of_week);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
