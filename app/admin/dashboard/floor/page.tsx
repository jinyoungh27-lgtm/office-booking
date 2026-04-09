"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/time";

interface BookingSummary {
  id: string;
  name: string;
  company: string;
  num_guests: number;
  email: string;
  phone: string;
}

interface DeskOccupancy {
  id: number;
  name: string;
  booking: BookingSummary | null;
}

interface UpcomingBooking {
  id: string;
  date: string;
  name: string;
  company: string;
  num_guests: number;
  status: string;
  code: string | null;
}

interface MeetingSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  visitor_name: string | null;
  booking_id: string;
}

const MEETING_START = 8 * 60;
const MEETING_END   = 18 * 60;
const TOTAL_MINS    = MEETING_END - MEETING_START;

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function FloorPage() {
  const router = useRouter();
  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const [date, setDate] = useState(todayISO);
  const [desks, setDesks] = useState<DeskOccupancy[]>([]);
  const [dayMeetingSlots, setDayMeetingSlots] = useState<MeetingSlot[]>([]);
  const [floorLoading, setFloorLoading] = useState(true);
  const [selected, setSelected] = useState<BookingSummary | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [upcomingMeeting, setUpcomingMeeting] = useState<MeetingSlot[]>([]);

  async function loadFloor(d: string) {
    setFloorLoading(true);
    const res = await fetch(`/api/admin/floor?date=${d}`);
    if (res.status === 401) { router.push("/admin"); return; }
    const data = await res.json();
    setDesks(data.desks ?? []);
    setDayMeetingSlots(data.meeting_room ?? []);
    setFloorLoading(false);
  }

  async function loadUpcoming() {
    const res = await fetch("/api/admin/upcoming");
    const data = await res.json();
    if (data.bookings) setUpcomingBookings(data.bookings);
    if (data.meetingSlots) setUpcomingMeeting(data.meetingSlots);
  }

  useEffect(() => { loadFloor(date); setSelected(null); }, [date]);
  useEffect(() => { loadUpcoming(); }, []);

  const occupied = desks.filter(d => d.booking).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-gray-900">Floor View</h1>
            <nav className="flex gap-1">
              <a href="/admin/dashboard" className="px-3 py-1.5 text-sm rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                Bookings
              </a>
              <span className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white font-medium">
                Floor View
              </span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* ── 1. Upcoming bookings ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Upcoming Bookings <span className="text-gray-400 font-normal normal-case">(next 14 days)</span>
          </h2>
          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center">
              <p className="text-gray-400 text-sm">No upcoming bookings.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {["Date", "Code", "Visitor", "Company", "Guests", "Status", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {upcomingBookings.map(b => {
                    const isToday = b.date === todayISO;
                    const label = new Date(b.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles",
                    });
                    return (
                      <tr
                        key={b.id}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? "bg-indigo-50/50" : ""}`}
                        onClick={() => router.push(`/admin/dashboard/${b.id}`)}
                      >
                        <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                          {label}
                          {isToday && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 font-semibold px-1.5 py-0.5 rounded-full">Today</span>}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-gray-500 text-xs">{b.code ?? "—"}</td>
                        <td className="px-5 py-3.5 text-gray-700">{b.name}</td>
                        <td className="px-5 py-3.5 text-gray-500">{b.company}</td>
                        <td className="px-5 py-3.5 text-gray-500">{b.num_guests}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-indigo-500 text-xs">Review →</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 2. Meeting room overall ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Meeting Room Schedule <span className="text-gray-400 font-normal normal-case">(next 14 days)</span>
          </h2>
          {upcomingMeeting.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center">
              <p className="text-gray-400 text-sm">No meeting room bookings.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {["Date", "Time", "Visitor", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {upcomingMeeting.map(slot => {
                    const isToday = slot.date === todayISO;
                    const label = new Date(slot.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles",
                    });
                    return (
                      <tr key={slot.id} className={`hover:bg-gray-50 cursor-pointer ${isToday ? "bg-indigo-50/50" : ""}`}
                        onClick={() => router.push(`/admin/dashboard/${slot.booking_id}`)}>
                        <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                          {label}
                          {isToday && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 font-semibold px-1.5 py-0.5 rounded-full">Today</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {formatTime(slot.start_time.slice(0,5))} – {formatTime(slot.end_time.slice(0,5))}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">{slot.visitor_name ?? "—"}</td>
                        <td className="px-5 py-3.5 text-indigo-500 text-xs">View →</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 3. Daily floor view ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Daily Floor View</h2>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {floorLoading ? (
            <div className="text-gray-400 text-sm py-12 text-center">Loading…</div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Desks Occupied", value: `${occupied} / ${desks.length}`, color: occupied > 0 ? "text-indigo-600" : "text-gray-400" },
                  { label: "Desks Free", value: `${desks.length - occupied}`, color: "text-green-600" },
                  { label: "Meeting Room Slots", value: `${dayMeetingSlots.length}`, color: dayMeetingSlots.length > 0 ? "text-indigo-600" : "text-gray-400" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Desks */}
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {desks.map(desk => (
                    <button
                      key={desk.id}
                      onClick={() => setSelected(desk.booking === selected ? null : desk.booking)}
                      disabled={!desk.booking}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        desk.booking
                          ? selected?.id === desk.booking.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                            : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer"
                          : "bg-gray-50 border-gray-100 cursor-default"
                      }`}
                    >
                      <p className={`text-xs font-semibold mb-2 ${desk.booking ? selected?.id === desk.booking.id ? "text-indigo-200" : "text-gray-400" : "text-gray-300"}`}>
                        {desk.name}
                      </p>
                      {desk.booking ? (
                        <>
                          <p className={`text-sm font-bold truncate ${selected?.id === desk.booking.id ? "text-white" : "text-gray-900"}`}>
                            {desk.booking.name}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${selected?.id === desk.booking.id ? "text-indigo-200" : "text-gray-400"}`}>
                            {desk.booking.company}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-300">Empty</p>
                      )}
                    </button>
                  ))}
                </div>
                {selected && (
                  <div className="mt-4 bg-white border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selected.name}</p>
                        <p className="text-gray-500 text-sm">{selected.company}</p>
                      </div>
                      <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-gray-400 mb-0.5">Guests</p><p className="text-gray-700 font-medium">{selected.num_guests}</p></div>
                      <div><p className="text-xs text-gray-400 mb-0.5">Email</p><p className="text-gray-700 font-medium">{selected.email}</p></div>
                      <div><p className="text-xs text-gray-400 mb-0.5">Phone</p><p className="text-gray-700 font-medium">{selected.phone}</p></div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Booking</p>
                        <a href={`/admin/dashboard/${selected.id}`} className="text-indigo-600 hover:underline font-medium text-xs">View full booking →</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting room for selected day */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Meeting Room</p>
                {dayMeetingSlots.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No meeting room bookings for this day.</p>
                ) : (
                  <>
                    <div className="relative h-10 bg-gray-50 rounded-xl overflow-hidden mb-3">
                      {dayMeetingSlots.map(slot => {
                        const start = toMinutes(slot.start_time.slice(0,5)) - MEETING_START;
                        const duration = toMinutes(slot.end_time.slice(0,5)) - toMinutes(slot.start_time.slice(0,5));
                        const left = (start / TOTAL_MINS) * 100;
                        const width = (duration / TOTAL_MINS) * 100;
                        return (
                          <div key={slot.id}
                            className="absolute top-1 bottom-1 bg-indigo-500 rounded-lg flex items-center px-2 overflow-hidden"
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${slot.visitor_name} · ${formatTime(slot.start_time.slice(0,5))}–${formatTime(slot.end_time.slice(0,5))}`}
                          >
                            <span className="text-white text-xs font-medium truncate">{slot.visitor_name}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 mb-4 px-0.5">
                      {["8 AM","10 AM","12 PM","2 PM","4 PM","6 PM"].map(t => <span key={t}>{t}</span>)}
                    </div>
                    <div className="space-y-2">
                      {dayMeetingSlots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-4 text-sm bg-gray-50 rounded-xl px-4 py-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-gray-500 w-40 shrink-0">{formatTime(slot.start_time.slice(0,5))} – {formatTime(slot.end_time.slice(0,5))}</span>
                          <span className="font-medium text-gray-900">{slot.visitor_name ?? "—"}</span>
                          <a href={`/admin/dashboard/${slot.booking_id}`} className="ml-auto text-indigo-500 hover:underline text-xs">View →</a>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
