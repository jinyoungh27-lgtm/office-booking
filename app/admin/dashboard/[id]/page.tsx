"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Booking } from "@/types";
import { formatTime } from "@/lib/time";

interface DeskWithAvailability {
  id: number;
  name: string;
  is_active: boolean;
  taken: boolean;
}

export default function AdminBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [desks, setDesks] = useState<DeskWithAvailability[]>([]);
  const [selectedDesks, setSelectedDesks] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const [bRes, dRes] = await Promise.all([
      fetch(`/api/admin/bookings/${id}`),
      fetch(`/api/admin/desks?date=placeholder`), // will update after booking loads
    ]);
    if (bRes.status === 401) { router.push("/admin"); return; }
    const b: Booking = await bRes.json();
    setBooking(b);
    setNotes(b.admin_notes ?? "");

    // Load desks for this booking's date
    const dRes2 = await fetch(`/api/admin/desks?date=${b.date}`);
    const d: DeskWithAvailability[] = await dRes2.json();
    setDesks(d);

    // Pre-select already-assigned desks (if confirmed)
    if (b.desk_assignments) {
      setSelectedDesks(b.desk_assignments.map((a) => a.desk_id));
    }

    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  function toggleDesk(deskId: number) {
    setSelectedDesks((prev) =>
      prev.includes(deskId) ? prev.filter((d) => d !== deskId) : [...prev, deskId]
    );
  }

  async function confirm() {
    if (!booking) return;
    if (selectedDesks.length !== booking.num_guests) {
      setError(`Please select exactly ${booking.num_guests} desk(s) (${selectedDesks.length} selected)`);
      return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", desk_ids: selectedDesks, admin_notes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Booking confirmed! Confirmation email sent to visitor.");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteBooking() {
    if (!window.confirm("Permanently delete this booking? This cannot be undone.")) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
      router.push("/admin/dashboard");
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  async function reject() {
    if (!booking) return;
    if (!window.confirm("Reject this booking?")) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", admin_notes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Booking rejected.");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading…</p></div>;
  if (!booking || !(booking as any).status) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Booking not found.</p></div>;

  const formattedDate = new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  const isPending = booking.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/admin/dashboard")} className="text-sm text-indigo-600 hover:underline">
            ← Dashboard
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-base font-semibold text-gray-800">Booking Review</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Visitor info */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Visitor Info</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                "bg-red-100 text-red-600"
              }`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: "Booking Code", value: (booking as any).code ?? "—" },
                { label: "Date", value: formattedDate },
                { label: "Guests", value: `${booking.num_guests}` },
                { label: "Name", value: booking.name },
                { label: "Company", value: booking.company },
                { label: "Purpose", value: booking.purpose },
                { label: "Phone", value: booking.phone },
                { label: "Email", value: booking.email },
                { label: "Submitted", value: new Date(booking.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-gray-400 w-24 shrink-0">{label}</span>
                  <span className="text-gray-900 font-medium break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned desks (if confirmed) */}
          {booking.status === "confirmed" && booking.desk_assignments && (
            <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">Assigned Desks</p>
              <div className="flex flex-wrap gap-2">
                {booking.desk_assignments.map((a) => (
                  <span key={a.id} className="bg-white border border-green-200 text-green-700 text-sm px-3 py-1 rounded-lg font-medium">
                    {a.desk?.name ?? `Desk #${a.desk_id}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meeting room bookings */}
          {booking.meeting_room_bookings && booking.meeting_room_bookings.length > 0 && (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">Meeting Room Reservations</p>
              <div className="space-y-1.5">
                {booking.meeting_room_bookings.map((m) => (
                  <div key={m.id} className="text-sm text-indigo-700 font-medium">
                    {formatTime(m.start_time.slice(0, 5))} – {formatTime(m.end_time.slice(0, 5))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-5">
          {/* Desk selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Assign Desks</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select {booking.num_guests} desk{booking.num_guests > 1 ? "s" : ""} for this booking.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {desks.map((desk) => {
                const isSelected = selectedDesks.includes(desk.id);
                // A desk is blocked if taken by ANOTHER booking (not the current one)
                const isCurrentBookingDesk = booking.desk_assignments?.some((a) => a.desk_id === desk.id);
                const isBlocked = desk.taken && !isCurrentBookingDesk;

                return (
                  <button
                    key={desk.id}
                    onClick={() => !isBlocked && isPending && toggleDesk(desk.id)}
                    disabled={isBlocked || !isPending}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${
                      isBlocked
                        ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isBlocked ? "bg-gray-300" : isSelected ? "bg-white" : "bg-gray-300"
                    }`} />
                    {desk.name}
                    {isBlocked && <span className="text-xs text-gray-300 ml-auto">Taken</span>}
                  </button>
                );
              })}
            </div>

            {isPending && (
              <p className="text-xs text-gray-400 mt-3">
                {selectedDesks.length} of {booking.num_guests} selected
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isPending}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="Any instructions or notes for the visitor…"
            />
          </div>

          {/* Action buttons */}
          {isPending && (
            <div className="flex gap-3">
              <button
                onClick={confirm}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {submitting ? "Confirming…" : "Confirm Booking"}
              </button>
              <button
                onClick={reject}
                disabled={submitting}
                className="flex-1 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 font-semibold py-3 rounded-xl border border-red-200 transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

          {/* Delete */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={deleteBooking}
              disabled={submitting}
              className="w-full text-sm text-gray-400 hover:text-red-500 disabled:opacity-50 py-2 transition-colors"
            >
              Delete this booking
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
