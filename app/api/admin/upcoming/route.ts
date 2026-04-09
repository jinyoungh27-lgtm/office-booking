import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Returns confirmed + pending bookings and meeting room slots from today onwards (next 14 days)
export async function GET() {
  const supabase = getSupabase();
  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const endDate = new Date(todayISO);
  endDate.setDate(endDate.getDate() + 14);
  const endISO = endDate.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  const [{ data: bookings, error: bErr }, { data: meetingSlots, error: mErr }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, date, name, company, num_guests, status, code")
      .gte("date", todayISO)
      .lte("date", endISO)
      .in("status", ["pending", "confirmed"])
      .order("date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("meeting_room_bookings")
      .select("id, date, start_time, end_time, visitor_name, booking_id")
      .gte("date", todayISO)
      .lte("date", endISO)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  return NextResponse.json({ bookings: bookings ?? [], meetingSlots: meetingSlots ?? [] });
}
