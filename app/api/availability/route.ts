import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TOTAL_DESKS = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const guests = parseInt(searchParams.get("guests") ?? "1", 10);

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const maxDate = new Date(todayISO);
  maxDate.setMonth(maxDate.getMonth() + 1);
  const maxISO = maxDate.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  if (date < todayISO) return NextResponse.json({ error: "Date is in the past" }, { status: 400 });
  if (date > maxISO) return NextResponse.json({ error: "Bookings can only be made up to 1 month in advance" }, { status: 400 });

  const supabase = getSupabase();

  // Check if date is a closed specific date or a closed weekday
  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  const [{ data: closedDate }, { data: closedWeekday }, { data: openOverride }] = await Promise.all([
    supabase.from("closed_dates").select("date").eq("date", date).maybeSingle(),
    supabase.from("closed_weekdays").select("day_of_week").eq("day_of_week", dayOfWeek).maybeSingle(),
    supabase.from("open_date_overrides").select("date").eq("date", date).maybeSingle(),
  ]);

  if (closedDate || (closedWeekday && !openOverride)) {
    return NextResponse.json({
      available: false,
      total_desks: TOTAL_DESKS,
      occupied: TOTAL_DESKS,
      free: 0,
      requested: guests,
      closed: true,
    });
  }

  // Count desks from confirmed assignments
  const { data: assignments, error: assignErr } = await supabase
    .from("desk_assignments")
    .select("id")
    .eq("date", date);

  if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 500 });

  // Count desks from pending bookings (not yet confirmed/rejected)
  const { data: pending, error: pendingErr } = await supabase
    .from("bookings")
    .select("num_guests")
    .eq("date", date)
    .eq("status", "pending");

  if (pendingErr) return NextResponse.json({ error: pendingErr.message }, { status: 500 });

  const confirmedOccupied = assignments?.length ?? 0;
  const pendingOccupied = pending?.reduce((sum, b) => sum + b.num_guests, 0) ?? 0;
  const occupied = confirmedOccupied + pendingOccupied;
  const free = TOTAL_DESKS - occupied;

  return NextResponse.json({
    available: free >= guests,
    total_desks: TOTAL_DESKS,
    occupied,
    free,
    requested: guests,
  });
}
