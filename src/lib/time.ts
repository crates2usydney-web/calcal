import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { addDays, startOfDay } from "date-fns";

export type Slot = { startISO: string; endISO: string; label: string; minutes: number };

export function ymdInTz(date: Date, tz: string): string {
  return formatInTimeZone(date, tz, "yyyy-MM-dd");
}

export function minutesToLabel(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  let h = h24 % 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, "0")}${suffix}`;
}

export function buildSlotsForDay(opts: {
  dayISO: string;
  tz: string;
  ranges: { start_min: number; end_min: number }[];
  duration: number;
  step: number;
  bookings: { start_utc: string; end_utc: string }[];
  busy?: { start_utc: string; end_utc: string }[];
  notBefore: Date;
}): Slot[] {
  const { dayISO, tz, ranges, duration, step, bookings, busy = [], notBefore } = opts;
  const dayStartUtc = fromZonedTime(`${dayISO}T00:00:00`, tz).getTime();
  const slots: Slot[] = [];
  for (const range of ranges) {
    for (let m = range.start_min; m + duration <= range.end_min; m += step) {
      const start = dayStartUtc + m * 60_000;
      const end = start + duration * 60_000;
      if (start < notBefore.getTime()) continue;
      const overlap = bookings.some(
        (b) => new Date(b.start_utc).getTime() < end && new Date(b.end_utc).getTime() > start
      );
      const busyOverlap = busy.some(
        (b) => new Date(b.start_utc).getTime() < end && new Date(b.end_utc).getTime() > start
      );
      if (overlap || busyOverlap) continue;
      slots.push({
        startISO: new Date(start).toISOString(),
        endISO: new Date(end).toISOString(),
        label: formatInTimeZone(new Date(start), tz, "h:mmaaa"),
        minutes: m,
      });
    }
  }
  return slots;
}

export function upcomingDays(tz: string, days = 60): string[] {
  const out: string[] = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < days; i++) out.push(ymdInTz(addDays(today, i), tz));
  return out;
}

export function formatDayLong(dayISO: string): string {
  const [y, m, d] = dayISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}