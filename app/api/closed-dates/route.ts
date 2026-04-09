import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Public endpoint — returns closed dates so visitors can see them in the date picker
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("closed_dates")
    .select("date, reason")
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
