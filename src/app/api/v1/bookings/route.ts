import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createBookingRecord, serializeBooking } from "@/lib/booking-service";
import { deliverDueEmails, sendBookingNotifications } from "@/lib/email";
import { emitEvent } from "@/lib/integrations/engine";
import { bookingEventPayload } from "@/lib/integrations/events";

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  let sql = "SELECT * FROM bookings WHERE host_id = ?";
  const args: unknown[] = [user.id];
  if (status) { sql += " AND status = ?"; args.push(status); }
  if (from) { sql += " AND start_utc >= ?"; args.push(from); }
  if (to) { sql += " AND start_utc <= ?"; args.push(to); }
  sql += " ORDER BY start_utc DESC LIMIT 200";
  const rows = db.prepare(sql).all(...(args as never[])) as Record<string, unknown>[];
  return json({ data: rows.map(serializeBooking), meta: { count: rows.length } });
}

export async function POST(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const result = createBookingRecord(user.id, {
    eventTypeId: body.eventTypeId ?? body.event_type_id ?? "",
    startISO: body.startISO ?? body.start ?? "",
    name: body.name ?? "",
    email: body.email ?? "",
    notes: body.notes ?? "",
  });
  if (!result.ok) return json({ error: result.error }, 422);
  await sendBookingNotifications(result.id);
  await deliverDueEmails();
  const evt = bookingEventPayload(result.id);
  if (evt) await emitEvent(evt.ownerId, "booking.created", evt.payload);
  const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.id) as Record<string, unknown>;
  return json({
    data: serializeBooking(row),
    confirmation_url: "/booking/" + result.id,
    payment_url: result.paymentRequired ? "/booking/" + result.id + "/pay" : null,
  }, 201);
}