import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/booking-service";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const row = db.prepare("SELECT * FROM bookings WHERE id = ? AND host_id = ?").get(id, user.id) as Record<string, unknown> | undefined;
  if (!row) return json({ error: "not_found" }, 404);
  return json({ data: serializeBooking(row) });
}
