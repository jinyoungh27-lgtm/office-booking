"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? "";
  const guests = parseInt(searchParams.get("guests") ?? "1", 10);

  const [form, setForm] = useState({
    name: "", company: "", purpose: "", phone: "", email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        timeZone: "America/Los_Angeles",
      })
    : "";

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, num_guests: guests, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/booking/${data.id}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  if (!date) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No date selected. <a href="/" className="text-indigo-600 underline">Go back</a></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <a href="/" className="text-sm text-indigo-600 hover:underline">← Back</a>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        {/* Summary */}
        <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-8">
          <p className="text-indigo-200 text-sm mb-1">Your visit</p>
          <p className="text-xl font-bold">{formattedDate}</p>
          <p className="text-indigo-200 mt-1">{guests} {guests === 1 ? "guest" : "guests"} · Full day</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Enter your details</h2>
          <p className="text-gray-500 text-sm mb-6">Admin will review and confirm your booking.</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company *</label>
                <input
                  required
                  type="text"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose of Visit *</label>
              <input
                required
                type="text"
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Partner meeting, demo, team offsite…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="jane@acme.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl mt-2 transition-colors"
            >
              {loading ? "Submitting…" : "Submit Booking Request"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            You&apos;ll receive a confirmation email once admin approves your request.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense>
      <BookForm />
    </Suspense>
  );
}
