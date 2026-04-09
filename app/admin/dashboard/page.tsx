"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Booking, BookingStatus, ClosedDate } from "@/types";
import ClosedDatesCalendar from "./ClosedDatesCalendar";

type Filter = "all" | BookingStatus;

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", rejected: "Rejected",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  async function load(p = page) {
    setLoading(true);
    const res = await fetch(`/api/admin/bookings?status=${filter}&page=${p}`, { cache: "no-store" });
    if (res.status === 401) { router.push("/admin"); return; }
    const json = await res.json();
    setBookings(Array.isArray(json.data) ? json.data : []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }

  async function loadClosedDates() {
    const res = await fetch("/api/admin/closed-dates");
    const data = await res.json();
    if (res.ok && Array.isArray(data)) setClosedDates(data);
  }

  async function blockDates(dates: string[]) {
    await Promise.all(dates.map(date =>
      fetch("/api/admin/closed-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      })
    ));
    await loadClosedDates();
  }

  async function unblockDates(dates: string[]) {
    await Promise.all(dates.map(date =>
      fetch("/api/admin/closed-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      })
    ));
    await loadClosedDates();
  }

  useEffect(() => { setPage(1); router.refresh(); load(1); }, [filter]);
  useEffect(() => { load(page); }, [page]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-900">Admin</h1>
            <nav className="flex gap-1">
              <span className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white font-medium">
                Bookings
                {pending > 0 && (
                  <span className="ml-1.5 bg-white text-indigo-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {pending}
                  </span>
                )}
              </span>
              <a
                href="/admin/dashboard/floor"
                className="px-3 py-1.5 text-sm rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Floor View
              </a>
            </nav>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "confirmed", "rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-12 text-center">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <p className="text-gray-400">No bookings found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {["Date", "Visitor", "Company", "Guests", "Purpose", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
                  const isPast = b.date < todayISO;
                  const date = new Date(b.date + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    timeZone: "America/Los_Angeles",
                  });
                  return (
                    <tr
                      key={b.id}
                      className={`cursor-pointer transition-colors ${isPast ? "opacity-50 hover:opacity-70" : "hover:bg-gray-50"}`}
                      onClick={() => router.push(`/admin/dashboard/${b.id}`)}
                    >
                      <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <span>{date}</span>
                        {isPast && <span className="ml-2 text-xs text-gray-400 font-normal">Past</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{b.name}</td>
                      <td className="px-5 py-4 text-gray-500">{b.company}</td>
                      <td className="px-5 py-4 text-gray-500">{b.num_guests}</td>
                      <td className="px-5 py-4 text-gray-500 max-w-[180px] truncate">{b.purpose}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status]}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-indigo-500 text-xs">Review →</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= total}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Closed Dates */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Closed Dates</h2>
          <ClosedDatesCalendar
            closedDates={closedDates}
            onBlock={blockDates}
            onUnblock={unblockDates}
          />
        </div>
      </main>
    </div>
  );
}
