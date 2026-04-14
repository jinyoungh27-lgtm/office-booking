"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityResult } from "@/types";
import DatePicker from "./components/DatePicker";

function LookupBooking() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setError("");
    const res = await fetch(`/api/booking/by-code?code=${encodeURIComponent(code.trim())}`);
    const data = await res.json();
    if (!res.ok) { setError("Booking not found. Check your code and try again."); setLoading(false); return; }
    router.push(`/booking/${data.id}`);
  }

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-sm font-semibold text-gray-700 mb-3">Already booked? Look up your reservation</p>
      <form onSubmit={lookup} className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. OFC-4829"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {loading ? "…" : "Find"}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState("");

async function checkAvailability() {
    if (!date) { setError("Please select a date"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`/api/availability?date=${date}&guests=${guests}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
          <a href="/admin" className="text-sm text-gray-400 hover:text-gray-600">Admin</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Naver Ventures</h2>
          <p className="text-gray-500 text-lg">Please review the following guidelines before booking your visit.</p>
        </div>

        {/* User Guide */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Visitor Guideline</h3>
          <div className="space-y-4">
            {[
              { step: "1", title: "Booking Guide", lines: [
                <>Please select your desired date on the booking page and complete your reservation. Once submitted, our team will review your request and send office access details via email.</>,
                <>Bookings are available on a <strong className="text-gray-700">per-day basis only</strong>.</>,
                <>For visitors, only <strong className="text-gray-700">Meeting Room 1</strong> is available. Meeting room reservations can be made through the link provided after your desk booking is confirmed.</>,
                <>If you do not receive a confirmation email within <strong className="text-gray-700">48 hours</strong>, please contact us at jinyoung.hwang1@navercorp.com and we will assist you promptly.</>,
              ]},
              { step: "2", title: "Office Location", lines: [<>555 Twin Dolphin Dr, Suite 365, Redwood City, CA — <a href="https://maps.google.com/?q=555+Twin+Dolphin+Dr,+Suite+365,+Redwood+City,+CA" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800">Google Maps</a></>] },
              { step: "3", title: "Office Hours",    lines: [<>09:00 – 17:00</>] },
            ].map(({ step, title, lines }) => (
              <div key={step} className="flex gap-4">
                <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <div className="space-y-1.5 mt-1">
                    {lines.map((line, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        <p className="text-sm text-gray-500">{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
            {/* Date */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Visit Date
              </label>
              <DatePicker value={date} onChange={(d) => { setDate(d); setResult(null); }} />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Guests
              </label>
              <select
                value={guests}
                onChange={(e) => { setGuests(parseInt(e.target.value)); setResult(null); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          <button
            onClick={checkAvailability}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Checking…" : "Check Availability"}
          </button>

          {/* Availability result */}
          {result && (
            <div className={`mt-6 p-5 rounded-xl border ${
              result.available
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              {result.available ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-xl">✓</span>
                    <span className="font-semibold text-green-800">Available!</span>
                  </div>
                  <p className="text-green-700 text-sm mb-1">
                    {result.free} of {result.total_desks} desks available on this date.
                  </p>
                  <p className="text-green-600 text-sm mb-4">
                    {result.requested} desk{result.requested > 1 ? "s" : ""} will be reserved for your group.
                  </p>
                  <button
                    onClick={() => router.push(`/book?date=${date}&guests=${guests}`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Book Now →
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 text-xl">✕</span>
                    <span className="font-semibold text-red-800">
                      {result.closed ? "Office Closed" : "Not Available"}
                    </span>
                  </div>
                  <p className="text-red-700 text-sm">
                    {result.closed
                      ? "The office is closed on this date. Please select a different date."
                      : `Only ${result.free} desk${result.free !== 1 ? "s" : ""} available, but you need ${result.requested}. Please try a different date or reduce your guest count.`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Booking lookup */}
        <LookupBooking />

        {/* Info */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "🖥️", label: "10 Desks", sub: "Workspace available" },
            { icon: "🏢", label: "1 Meeting Room", sub: "Book after confirmation" },
            { icon: "📅", label: "Book Ahead", sub: "Up to 1 month in advance" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-sm font-semibold text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
