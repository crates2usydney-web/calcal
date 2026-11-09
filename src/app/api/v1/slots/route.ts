import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getAvailability, slotsForDay } from "@/lib/slots";

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const eventTypeId = url.searchParams.get("event_type_id");
  const date = url.searchParams.get("date");
  if (!eventTypeId || !date) return json({ error: "event_type_id and date (YYYY-MM-DD) required" }, 422);
  const et = db.prepare("SELECT duration FROM event_types WHERE id = ? AND user_id = ?").get(eventTypeId, user.id) as { duration: number } | undefined;
  if (!et) return json({ error: "event_type not found" }, 404);
  const slots = slotsForDay({ userId: user.id, tz: user.timezone, dayISO: date, duration: et.duration, availability: getAvailability(user.id) });
  return json({ data: slots, timezone: user.timezone, date });
}
