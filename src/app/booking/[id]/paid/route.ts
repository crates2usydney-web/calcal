import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isStripeConfigured, retrieveSession } from "@/lib/stripe";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const base = process.env.APP_URL || req.nextUrl.origin;
  const booking = db.prepare("SELECT id, payment_status FROM bookings WHERE id = ?").get(id) as { id: string; payment_status: string } | undefined;
  if (!booking) return Response.redirect(new URL("/", base));

  if (isStripeConfigured()) {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) return Response.redirect(new URL("/booking/" + id + "/pay", base));
    const session = await retrieveSession(sessionId);
    if (!session || session.payment_status !== "paid") {
      return Response.redirect(new URL("/booking/" + id + "/pay?unpaid=1", base));
    }
  }
  db.prepare("UPDATE bookings SET payment_status = 'paid', paid_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  return Response.redirect(new URL("/booking/" + id + "?paid=1", base));
}
