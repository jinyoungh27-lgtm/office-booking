import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Public endpoint — used by the visitor date picker
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("closed_weekdays")
    .select("day_of_week")
    .order("day_of_week");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r: any) => r.day_of_week));
}
