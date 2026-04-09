import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { booking_id, date, start_time, end_time } = body;

  if (!booking_id || !date || !start_time || !end_time) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (start_time >= end_time) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Verify booking is confirmed
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, name")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Meeting room can only be booked after desk booking is confirmed" },
      { status: 403 }
    );
  }

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from("meeting_room_bookings")
    .select("id")
    .eq("date", date)
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: "That time slot overlaps with an existing booking" },
      { status: 409 }
    );
  }

  // Create meeting room booking (auto-confirmed)
  const { data, error } = await supabase
    .from("meeting_room_bookings")
    .insert({ booking_id, date, start_time, end_time, visitor_name: booking.name })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
