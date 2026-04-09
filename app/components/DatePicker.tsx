"use client";

import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (date: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DatePicker({ value, onChange }: Props) {
  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const todayDate = new Date(todayISO);
  // Max bookable date: 1 month from today
  const maxDate = new Date(todayDate);
  maxDate.setMonth(maxDate.getMonth() + 1);
  const maxISO = maxDate.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  const initDate = value ? new Date(value + "T12:00:00") : new Date();
  const [year, setYear] = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());
  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [closedReasons, setClosedReasons] = useState<Map<string, string>>(new Map());
  const [closedWeekdays, setClosedWeekdays] = useState<Set<number>>(new Set());
  const [openOverrides, setOpenOverrides] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/closed-dates").then(r => r.json()),
      fetch("/api/closed-weekdays").then(r => r.json()),
      fetch("/api/open-date-overrides").then(r => r.json()),
    ]).then(([dates, weekdays, overrides]) => {
      if (Array.isArray(dates)) {
        setClosedDates(new Set(dates.map((d: any) => d.date)));
        setClosedReasons(new Map(dates.filter((d: any) => d.reason).map((d: any) => [d.date, d.reason])));
      }
      if (Array.isArray(weekdays)) setClosedWeekdays(new Set(weekdays));
      if (Array.isArray(overrides)) setOpenOverrides(new Set(overrides));
    });
  }, []);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Prevent navigating outside allowed range
  const isCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth();
  const isMaxMonth = year === maxDate.getFullYear() && month === maxDate.getMonth();

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
        <button
          onClick={nextMonth}
          disabled={isMaxMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const date = isoDate(year, month, day);
          const isPast = date < todayISO;
          const isTooFar = date > maxISO;
          const dayOfWeek = new Date(date + "T12:00:00").getDay();
          const isClosed = closedDates.has(date) || (closedWeekdays.has(dayOfWeek) && !openOverrides.has(date));
          const isSelected = date === value;
          const isToday = date === todayISO;
          const disabled = isPast || isClosed || isTooFar;
          const reason = closedReasons.get(date);

          let cls = "relative flex items-center justify-center h-9 text-sm rounded-lg transition-colors ";

          if (isSelected) {
            cls += "bg-indigo-600 text-white font-semibold";
          } else if (isClosed) {
            cls += "bg-red-50 text-red-300 cursor-not-allowed";
          } else if (isPast || isTooFar) {
            cls += "text-gray-300 cursor-not-allowed";
          } else if (isToday) {
            cls += "bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 cursor-pointer";
          } else {
            cls += "text-gray-700 hover:bg-gray-100 cursor-pointer";
          }

          return (
            <div
              key={date}
              className={cls}
              onClick={() => !disabled && onChange(date)}
              title={isClosed ? (reason ? `Closed: ${reason}` : "Office closed") : undefined}
            >
              {isClosed ? (
                <span className="relative">
                  {day}
                  <span className="absolute inset-x-0 top-1/2 border-t border-red-300" />
                </span>
              ) : day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-indigo-600" /> Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Closed
        </span>
      </div>
    </div>
  );
}
