import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendVisitorConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET a single booking with all relations
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

// PUT — confirm or reject a booking
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, desk_ids, admin_notes } = body;

  const supabase = getSupabase();

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status !== "pending") {
    return NextResponse.json({ error: "Booking already processed" }, { status: 400 });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "rejected", admin_notes: admin_notes ?? null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (action === "confirm") {
    if (!desk_ids || desk_ids.length !== booking.num_guests) {
      return NextResponse.json(
        { error: `Please select exactly ${booking.num_guests} desk(s)` },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "confirmed", admin_notes: admin_notes ?? null })
      .eq("id", id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    const assignments = desk_ids.map((desk_id: number) => ({
      booking_id: id,
      desk_id,
      date: booking.date,
    }));

    const { data: assignData, error: assignErr } = await supabase
      .from("desk_assignments")
      .insert(assignments)
      .select("*, desk:desks(id, name)");

    if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 500 });

    sendVisitorConfirmation({ ...booking, status: "confirmed" }, assignData ?? []).catch(console.error);

    return NextResponse.json({ ok: true, status: "confirmed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE — permanently remove a booking and all related data
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
