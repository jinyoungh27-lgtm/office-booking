"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Booking, MeetingRoomBooking } from "@/types";
import { TIME_SLOTS, formatTime } from "@/lib/time";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending:   "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    rejected:  "bg-red-100 text-red-700",
  }[status] ?? "bg-gray-100 text-gray-600";

  const labels = { pending: "Pending Review", confirmed: "Confirmed", rejected: "Rejected" };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${styles}`}>
      {labels[status as keyof typeof labels] ?? status}
    </span>
  );
}

// ── Meeting Room Booking ──────────────────────────────────────────────────────
function MeetingRoomSection({ booking }: { booking: Booking }) {
  const [bookedSlots, setBookedSlots] = useState<MeetingRoomBooking[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function loadSlots() {
    const res = await fetch(`/api/meeting-room/availability?date=${booking.date}`);
    const data = await res.json();
    setBookedSlots(data);
  }

  useEffect(() => { loadSlots(); }, []);

  function isSlotConflicting(slot: string): boolean {
    return bookedSlots.some(
      (b) => slot >= b.start_time.slice(0, 5) && slot < b.end_time.slice(0, 5)
    );
  }

  async function bookRoom() {
    if (!startTime || !endTime) { setError("Select start and end time"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/meeting-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          date: booking.date,
          start_time: startTime,
          end_time: endTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setStartTime(""); setEndTime("");
      loadSlots();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const availableStarts = TIME_SLOTS.filter((t) => !isSlotConflicting(t) && t < "18:00");
  const availableEnds = startTime
    ? TIME_SLOTS.filter((t) => t > startTime && !isSlotConflicting(t))
    : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Meeting Room</h3>
      <p className="text-sm text-gray-500 mb-5">
        Book the meeting room for your visit day. Time-based, first-come first-served.
      </p>

      {/* Existing bookings */}
      {bookedSlots.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Already Booked</p>
          <div className="space-y-1.5">
            {bookedSlots.map((b) => (
              <div key={b.id} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="text-gray-700">
                  {formatTime(b.start_time.slice(0, 5))} – {formatTime(b.end_time.slice(0, 5))}
                </span>
                {b.visitor_name && (
                  <span className="text-gray-400 text-xs ml-auto">{b.visitor_name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
          Meeting room booked! See you there.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      {/* Booking form */}
      {booking.meeting_room_bookings && booking.meeting_room_bookings.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Meeting Room Bookings</p>
          {booking.meeting_room_bookings.map((b) => (
            <div key={b.id} className="flex items-center gap-2 text-sm bg-indigo-50 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-indigo-700 font-medium">
                {formatTime(b.start_time.slice(0, 5))} – {formatTime(b.end_time.slice(0, 5))}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
          <select
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); setEndTime(""); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select…</option>
            {availableStarts.map((t) => (
              <option key={t} value={t}>{formatTime(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={!startTime}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">Select…</option>
            {availableEnds.map((t) => (
              <option key={t} value={t}>{formatTime(t)}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={bookRoom}
        disabled={loading || !startTime || !endTime}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
      >
        {loading ? "Booking…" : "Book Meeting Room"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookingStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/booking/${id}`)
      .then((r) => r.json())
      .then((d) => { setBooking(d); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!booking || (booking as any).error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Booking not found.</p>
          <a href="/" className="text-indigo-600 underline text-sm">Go home</a>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <a href="/" className="text-sm text-indigo-600 hover:underline">← New Booking</a>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12 space-y-5">
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              {(booking as any).code && (
                <>
                  <p className="text-xs text-gray-400 mb-1">Booking Code</p>
                  <p className="text-2xl font-bold text-indigo-600 tracking-widest">{(booking as any).code}</p>
                  <p className="text-xs text-gray-400 mt-1">Save this code to look up your booking</p>
                </>
              )}
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="border-t border-gray-50 pt-4 space-y-3">
            {[
              { label: "Date", value: formattedDate },
              { label: "Guests", value: `${booking.num_guests}` },
              { label: "Name", value: booking.name },
              { label: "Company", value: booking.company },
              { label: "Purpose", value: booking.purpose },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-900 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {booking.status === "pending" && (
            <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              Your request is being reviewed. You&apos;ll get an email once it&apos;s confirmed.
            </div>
          )}

          {booking.status === "confirmed" && booking.desk_assignments && (
            <div className="mt-5 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Assigned Desks</p>
              <div className="flex flex-wrap gap-2">
                {booking.desk_assignments.map((a) => (
                  <span key={a.id} className="bg-white border border-green-200 text-green-700 text-sm px-3 py-1 rounded-lg font-medium">
                    {a.desk?.name ?? `Desk #${a.desk_id}`}
                  </span>
                ))}
              </div>
              {booking.admin_notes && (
                <p className="text-green-700 text-xs mt-2">Note: {booking.admin_notes}</p>
              )}
            </div>
          )}

          {booking.status === "rejected" && (
            <div className="mt-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              Unfortunately your booking was not approved.
              {booking.admin_notes && <span> Reason: {booking.admin_notes}</span>}
            </div>
          )}
        </div>

        {/* Meeting room — only if confirmed */}
        {booking.status === "confirmed" && <MeetingRoomSection booking={booking} />}
      </main>
    </div>
  );
}
