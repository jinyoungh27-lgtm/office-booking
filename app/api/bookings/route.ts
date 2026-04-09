import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendAdminNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, num_guests, name, company, purpose, phone, email } = body;

  if (!date || !num_guests || !name || !company || !purpose || !phone || !email) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const maxDate = new Date(todayISO);
  maxDate.setMonth(maxDate.getMonth() + 1);
  const maxISO = maxDate.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  if (date < todayISO) return NextResponse.json({ error: "Date is in the past" }, { status: 400 });
  if (date > maxISO) return NextResponse.json({ error: "Bookings can only be made up to 1 month in advance" }, { status: 400 });

  const supabase = getSupabase();
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const [{ data: closedDate }, { data: closedWeekday }, { data: openOverride }] = await Promise.all([
    supabase.from("closed_dates").select("date").eq("date", date).maybeSingle(),
    supabase.from("closed_weekdays").select("day_of_week").eq("day_of_week", dayOfWeek).maybeSingle(),
    supabase.from("open_date_overrides").select("date").eq("date", date).maybeSingle(),
  ]);
  if (closedDate || (closedWeekday && !openOverride)) {
    return NextResponse.json({ error: "The office is closed on this date" }, { status: 400 });
  }

  // Generate a unique short code like OFC-4829
  let code = "";
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = "OFC-" + String(Math.floor(1000 + Math.random() * 9000));
    const { data: existing } = await supabase.from("bookings").select("id").eq("code", candidate).maybeSingle();
    if (!existing) { code = candidate; break; }
  }
  if (!code) return NextResponse.json({ error: "Could not generate booking code, please try again" }, { status: 500 });

  const { data, error } = await supabase
    .from("bookings")
    .insert({ date, num_guests, name, company, purpose, phone, email, status: "pending", code })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify admin (non-blocking)
  sendAdminNotification(data).catch(console.error);

  return NextResponse.json(data, { status: 201 });
}
