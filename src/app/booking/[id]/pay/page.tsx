import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createCheckoutAction, markPaidAction } from "@/lib/actions";
import { isStripeConfigured } from "@/lib/stripe";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = db
    .prepare(
      "SELECT b.*, e.title, e.currency, u.name AS host_name, u.timezone FROM bookings b JOIN event_types e ON e.id = b.event_type_id JOIN users u ON u.id = b.host_id WHERE b.id = ?"
    )
    .get(id) as
    | { id: string; title: string; currency: string; amount_cents: number; payment_status: string; start_utc: string; host_name: string; timezone: string }
    | undefined;
  if (!b) notFound();
  if (b.payment_status === "paid") redirect("/booking/" + id);

  const amount = ((b.amount_cents || 0) / 100).toFixed(2);
  const when = new Date(b.start_utc).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: b.timezone });
  const configured = isStripeConfigured();

  return (
    <div className="min-h-screen bg-mist/40 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 card-shadow">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand">Payment required</p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">{b.title}</h1>
          <p className="mt-1 text-[13.5px] text-muted">with {b.host_name} · {when}</p>

          <div className="mt-6 flex items-baseline justify-between rounded-xl border border-line p-4">
            <span className="text-[13px] text-muted">Total due</span>
            <span className="text-[24px] font-semibold">{b.currency.toUpperCase()} {amount}</span>
          </div>

          {configured ? (
            <form action={createCheckoutAction} className="mt-5">
              <input type="hidden" name="id" value={b.id} />
              <button className="w-full rounded-lg bg-brand py-3 text-[14px] font-semibold text-white hover:bg-brand-dark">
                Pay with card
              </button>
            </form>
          ) : (
            <div className="mt-5">
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                Stripe is not configured on this server. This is a demo payment step — set STRIPE_SECRET_KEY to use real Checkout.
              </p>
              <form action={markPaidAction} className="mt-3">
                <input type="hidden" name="id" value={b.id} />
                <button className="w-full rounded-lg bg-navy py-3 text-[14px] font-semibold text-white">Pay {b.currency.toUpperCase()} {amount} (demo)</button>
              </form>
            </div>
          )}

          <p className="mt-4 text-center text-[12px] text-muted">
            <Link href={"/booking/" + b.id} className="text-brand hover:underline">Cancel and view booking</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
