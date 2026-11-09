import { db } from "@/lib/db";
import { getAvailability, slotsForDay } from "@/lib/slots";
import { json } from "@/lib/api-auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const slug = url.searchParams.get("slug");
  const date = url.searchParams.get("date");
  if (!username || !slug || !date) return json({ error: "username, slug and date required" }, 422);
  const row = db
    .prepare("SELECT e.duration, e.user_id, u.timezone FROM event_types e JOIN users u ON u.id = e.user_id WHERE u.username = ? AND e.slug = ? AND e.active = 1")
    .get(username.toLowerCase(), slug) as { duration: number; user_id: string; timezone: string } | undefined;
  if (!row) return json({ error: "not_found" }, 404);
  const slots = slotsForDay({ userId: row.user_id, tz: row.timezone, dayISO: date, duration: row.duration, availability: getAvailability(row.user_id) });
  return json({ data: slots, timezone: row.timezone, date });
}
