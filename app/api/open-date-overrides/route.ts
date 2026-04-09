import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Public endpoint — used by the visitor date picker
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("open_date_overrides")
    .select("date")
    .order("date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r: any) => r.date));
}
