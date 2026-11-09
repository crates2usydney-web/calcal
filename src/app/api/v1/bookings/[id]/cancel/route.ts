import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sendCancellationNotifications } from "@/lib/email";
import { emitEvent } from "@/lib/integrations/engine";
import { bookingEventPayload } from "@/lib/integrations/events";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const row = db.prepare("SELECT id FROM bookings WHERE id = ? AND host_id = ?").get(id, user.id);
  if (!row) return json({ error: "not_found" }, 404);
  const evt = bookingEventPayload(id);
  db.prepare("UPDATE bookings SET status = 'canceled' WHERE id = ?").run(id);
  if (evt) await emitEvent(evt.ownerId, "booking.canceled", { ...evt.payload, status: "canceled" });
  sendCancellationNotifications(id);
  return json({ canceled: true, id });
}