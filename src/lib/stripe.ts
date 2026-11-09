import { createHmac, timingSafeEqual } from "node:crypto";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(opts: {
  bookingId: string;
  amountCents: number;
  currency: string;
  title: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; id: string } | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": opts.currency,
    "line_items[0][price_data][unit_amount]": String(opts.amountCents),
    "line_items[0][price_data][product_data][name]": opts.title,
    "line_items[0][quantity]": "1",
    customer_email: opts.email,
    success_url: opts.successUrl + "?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.bookingId,
    "metadata[booking_id]": opts.bookingId,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("stripe session failed: " + res.status + " " + (await res.text()).slice(0, 200));
  const data = (await res.json()) as { id: string; url: string };
  return { url: data.url, id: data.id };
}

export async function retrieveSession(id: string): Promise<{ payment_status?: string; status?: string } | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(id), {
    headers: { Authorization: "Bearer " + key },
  });
  if (!res.ok) return null;
  return (await res.json()) as { payment_status?: string; status?: string };
}

export function verifyStripeSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
