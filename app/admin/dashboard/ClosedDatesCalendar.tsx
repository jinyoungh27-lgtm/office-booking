"use client";

import { useState, useCallback, useEffect } from "react";
import { ClosedDate } from "@/types";

interface Props {
  closedDates: ClosedDate[];
  onBlock: (dates: string[]) => Promise<void>;
  onUnblock: (dates: string[]) => Promise<void>;
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ClosedDatesCalendar({ closedDates, onBlock, onUnblock }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");
  const [saving, setSaving] = useState(false);
  const [closedWeekdays, setClosedWeekdays] = useState<Set<number>>(new Set());
  const [openOverrides, setOpenOverrides] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/closed-weekdays")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setClosedWeekdays(new Set(data)); });
    fetch("/api/admin/open-date-overrides")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOpenOverrides(new Set(data)); });
  }, []);

  async function toggleWeekday(day: number) {
    const isBlocked = closedWeekdays.has(day);
    const method = isBlocked ? "DELETE" : "POST";
    const res = await fetch("/api/admin/closed-weekdays", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_of_week: day }),
    });
    if (res.ok) {
      setClosedWeekdays(prev => {
        const next = new Set(prev);
        isBlocked ? next.delete(day) : next.add(day);
        return next;
      });
    }
  }

  const closedSet = new Set(closedDates.map((d) => d.date));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(new Set());
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(new Set());
  }

  function handleMouseDown(date: string) {
    const mode = selected.has(date) ? "remove" : "add";
    setDragMode(mode);
    setDragging(true);
    setSelected(prev => {
      const next = new Set(prev);
      mode === "add" ? next.add(date) : next.delete(date);
      return next;
    });
  }

  function handleMouseEnter(date: string) {
    if (!dragging) return;
    setSelected(prev => {
      const next = new Set(prev);
      dragMode === "add" ? next.add(date) : next.delete(date);
      return next;
    });
  }

  const stopDrag = useCallback(() => setDragging(false), []);
  useEffect(() => {
    window.addEventListener("mouseup", stopDrag);
    return () => window.removeEventListener("mouseup", stopDrag);
  }, [stopDrag]);

  const selectedArray = Array.from(selected).sort();
  const selectedSpecificClosed = selectedArray.filter(d => closedSet.has(d));
  const selectedWeekdayClosed = selectedArray.filter(d => {
    const dow = new Date(d + "T12:00:00").getDay();
    return closedWeekdays.has(dow) && !openOverrides.has(d) && !closedSet.has(d);
  });
  const selectedOverrideOpen = selectedArray.filter(d => openOverrides.has(d));
  const selectedOpen = selectedArray.filter(d => {
    const dow = new Date(d + "T12:00:00").getDay();
    return !closedSet.has(d) && !closedWeekdays.has(dow) && !openOverrides.has(d);
  });

  async function handleBlock() {
    if (selectedOpen.length === 0) return;
    setSaving(true);
    await onBlock(selectedOpen);
    setSelected(new Set());
    setSaving(false);
  }

  async function handleUnblock() {
    if (selectedSpecificClosed.length === 0) return;
    setSaving(true);
    await onUnblock(selectedSpecificClosed);
    setSelected(new Set());
    setSaving(false);
  }

  async function handleOverrideOpen() {
    setSaving(true);
    await Promise.all(selectedWeekdayClosed.map(date =>
      fetch("/api/admin/open-date-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      })
    ));
    setOpenOverrides(prev => {
      const next = new Set(prev);
      selectedWeekdayClosed.forEach(d => next.add(d));
      return next;
    });
    setSelected(new Set());
    setSaving(false);
  }

  async function handleRemoveOverride() {
    setSaving(true);
    await Promise.all(selectedOverrideOpen.map(date =>
      fetch("/api/admin/open-date-overrides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      })
    ));
    setOpenOverrides(prev => {
      const next = new Set(prev);
      selectedOverrideOpen.forEach(d => next.delete(d));
      return next;
    });
    setSelected(new Set());
    setSaving(false);
  }

  // Build grid cells (leading empty + day cells)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 select-none">
      {/* Recurring weekday toggles */}
      <div className="mb-5 pb-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Block Every…</p>
        <div className="flex gap-2 flex-wrap">
          {WEEKDAY_NAMES.map((name, day) => (
            <button
              key={day}
              onClick={() => toggleWeekday(day)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                closedWeekdays.has(day)
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          ‹
        </button>
        <span className="font-semibold text-gray-900">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = isoDate(year, month, day);
          const dayOfWeek = new Date(date + "T12:00:00").getDay();
          const isSpecificClosed = closedSet.has(date);
          const isWeekdayClosed = closedWeekdays.has(dayOfWeek);
          const isOverrideOpen = openOverrides.has(date);
          const isClosed = isSpecificClosed || (isWeekdayClosed && !isOverrideOpen);
          const isSelected = selected.has(date);
          const isToday = date === isoDate(today.getFullYear(), today.getMonth(), today.getDate());

          let cellClass = "relative flex items-center justify-center rounded-lg h-10 text-sm cursor-pointer transition-colors ";

          if (isSelected && isClosed) {
            cellClass += "bg-red-200 text-red-900 ring-2 ring-red-400";
          } else if (isSelected && isOverrideOpen) {
            cellClass += "bg-green-200 text-green-900 ring-2 ring-green-400";
          } else if (isSelected) {
            cellClass += "bg-indigo-200 text-indigo-900 ring-2 ring-indigo-400";
          } else if (isOverrideOpen) {
            cellClass += "bg-green-50 text-green-700 font-medium ring-1 ring-green-300";
          } else if (isClosed) {
            cellClass += "bg-red-100 text-red-600 font-medium";
          } else if (isToday) {
            cellClass += "bg-indigo-50 text-indigo-700 font-semibold";
          } else {
            cellClass += "hover:bg-gray-100 text-gray-700";
          }

          return (
            <div
              key={date}
              className={cellClass}
              onMouseDown={() => handleMouseDown(date)}
              onMouseEnter={() => handleMouseEnter(date)}
            >
              {day}
              {isClosed && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Closed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-50 border border-green-300" /> Opened (override)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-200" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-indigo-200 border border-indigo-400" /> Selected
        </span>
      </div>

      {/* Upcoming blocked dates list */}
      {closedDates.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Blocked Dates</p>
          <div className="flex flex-wrap gap-2">
            {closedDates.map((cd) => {
              const label = new Date(cd.date + "T12:00:00").toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles",
              });
              return (
                <span key={cd.date} className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-1.5 rounded-lg">
                  {label}
                  {cd.reason && <span className="text-red-400">· {cd.reason}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {selected.size > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500 mr-auto">
            {selected.size} date{selected.size !== 1 ? "s" : ""} selected
          </span>
          {selectedOpen.length > 0 && (
            <button onClick={handleBlock} disabled={saving}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Block {selectedOpen.length} date{selectedOpen.length !== 1 ? "s" : ""}
            </button>
          )}
          {selectedSpecificClosed.length > 0 && (
            <button onClick={handleUnblock} disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Open {selectedSpecificClosed.length} date{selectedSpecificClosed.length !== 1 ? "s" : ""}
            </button>
          )}
          {selectedWeekdayClosed.length > 0 && (
            <button onClick={handleOverrideOpen} disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Open {selectedWeekdayClosed.length} specific date{selectedWeekdayClosed.length !== 1 ? "s" : ""}
            </button>
          )}
          {selectedOverrideOpen.length > 0 && (
            <button onClick={handleRemoveOverride} disabled={saving}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Re-block {selectedOverrideOpen.length} date{selectedOverrideOpen.length !== 1 ? "s" : ""}
            </button>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
