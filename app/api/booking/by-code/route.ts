import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return NextResponse.json({ id: data.id });
}
