import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/admin/desks?date=YYYY-MM-DD
// Returns all desks with info on whether they're taken on that date
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const supabase = getSupabase();

  const [{ data: desks }, { data: taken }] = await Promise.all([
    supabase.from("desks").select("*").eq("is_active", true).order("id"),
    date
      ? supabase.from("desk_assignments").select("desk_id, booking_id").eq("date", date)
      : Promise.resolve({ data: [] }),
  ]);

  const takenDeskIds = new Set((taken ?? []).map((t: any) => t.desk_id));

  return NextResponse.json(
    (desks ?? []).map((d: any) => ({ ...d, taken: takenDeskIds.has(d.id) }))
  );
}
