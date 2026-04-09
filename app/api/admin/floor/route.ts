import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/floor?date=YYYY-MM-DD
// Returns desk occupancy + meeting room schedule for a given date
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const supabase = getSupabase();

  const [
    { data: desks, error: desksErr },
    { data: assignments, error: assignErr },
    { data: meetingSlots, error: meetingErr },
  ] = await Promise.all([
    supabase.from("desks").select("id, name").eq("is_active", true).order("id"),
    supabase
      .from("desk_assignments")
      .select("desk_id, booking:bookings(id, name, company, num_guests, email, phone)")
      .eq("date", date),
    supabase
      .from("meeting_room_bookings")
      .select("id, start_time, end_time, visitor_name, booking_id")
      .eq("date", date)
      .order("start_time"),
  ]);

  if (desksErr) return NextResponse.json({ error: desksErr.message }, { status: 500 });
  if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 500 });
  if (meetingErr) return NextResponse.json({ error: meetingErr.message }, { status: 500 });

  const assignMap = new Map(
    (assignments ?? []).map((a: any) => [a.desk_id, a.booking])
  );

  const deskOccupancy = (desks ?? []).map((d: any) => ({
    ...d,
    booking: assignMap.get(d.id) ?? null,
  }));

  return NextResponse.json({
    desks: deskOccupancy,
    meeting_room: meetingSlots ?? [],
  });
}
