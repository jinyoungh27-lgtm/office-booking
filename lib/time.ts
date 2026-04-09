// Meeting room time slots: 8:00 AM – 6:00 PM in 30-min increments
export const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

// Check if two time ranges overlap
export function timesOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return aStart < bEnd && aEnd > bStart;
}
