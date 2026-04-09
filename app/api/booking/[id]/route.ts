import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      desk_assignments (
        id, desk_id, date,
        desk:desks (id, name)
      ),
      meeting_room_bookings (
        id, date, start_time, end_time, visitor_name, created_at
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
