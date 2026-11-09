import { db } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret && !verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }
  let event: { type?: string; data?: { object?: { metadata?: { booking_id?: string }; client_reference_id?: string } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const obj = event.data?.object;
    const bookingId = obj?.metadata?.booking_id ?? obj?.client_reference_id;
    if (bookingId) {
      db.prepare("UPDATE bookings SET payment_status = 'paid', paid_at = ? WHERE id = ?").run(new Date().toISOString(), bookingId);
    }
  }
  return Response.json({ received: true });
}
