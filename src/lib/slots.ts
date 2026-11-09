import { db } from "./db";
import { buildSlotsForDay, Slot, ymdInTz } from "./time";
import { addDays, startOfDay } from "date-fns";
import { busyForRange } from "./google";

export type AvailabilityRow = { weekday: number; start_min: number; end_min: number };

export function getAvailability(userId: string): AvailabilityRow[] {
  return db
    .prepare("SELECT weekday, start_min, end_min FROM availability WHERE user_id = ? ORDER BY weekday, start_min")
    .all(userId) as AvailabilityRow[];
}

export function getBookingsBetween(userId: string, fromISO: string, toISO: string) {
  return db
    .prepare(
      "SELECT start_utc, end_utc FROM bookings WHERE host_id = ? AND status = 'confirmed' AND start_utc < ? AND end_utc > ?"
    )
    .all(userId, toISO, fromISO) as { start_utc: string; end_utc: string }[];
}

export function slotsForDay(opts: {
  userId: string;
  tz: string;
  dayISO: string;
  duration: number;
  availability: AvailabilityRow[];
  noticesHours?: number;
}): Slot[] {
  const { userId, tz, dayISO, duration, availability, noticesHours = 4 } = opts;
  const weekday = new Date(dayISO + "T00:00:00Z").getUTCDay();
  const ranges = availability.filter((a) => a.weekday === weekday);
  if (!ranges.length) return [];
  const bookings = getBookingsBetween(userId, dayISO + "T00:00:00Z", dayISO + "T23:59:59Z");
  const busy = busyForRange(userId, dayISO + "T00:00:00Z", dayISO + "T23:59:59Z");
  return buildSlotsForDay({
    dayISO,
    tz,
    ranges,
    duration,
    step: duration <= 15 ? 15 : 30,
    bookings,
    busy,
    notBefore: new Date(Date.now() + noticesHours * 3600_000),
  });
}

export function availabilityByDay(userId: string, tz: string, days = 60) {
  const availability = getAvailability(userId);
  const map: Record<string, string[]> = {};
  const start = startOfDay(new Date());
  for (let i = 0; i < days; i++) {
    const dayISO = ymdInTz(addDays(start, i), tz);
    const weekday = addDays(start, i).getDay();
    if (!availability.some((a) => a.weekday === weekday)) continue;
    map[dayISO] = [];
  }
  return map;
}