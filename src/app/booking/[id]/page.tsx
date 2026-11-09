import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cancelBookingAction } from "@/lib/actions";

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = db
    .prepare(
      `SELECT b.*, e.title, e.duration, e.location, e.currency, u.name AS host_name, u.timezone AS host_tz, u.username
       FROM bookings b
       JOIN event_types e ON e.id = b.event_type_id
       JOIN users u ON u.id = b.host_id
       WHERE b.id = ?`
    )
    .get(id) as
    | {
        id: string; invitee_name: string; invitee_email: string; notes: string; start_utc: string; end_utc: string;
        status: string; title: string; duration: number; location: string; host_name: string; host_tz: string; username: string;
        payment_status: string; amount_cents: number; currency: string;
      }
    | undefined;
  if (!b) notFound();

  const start = new Date(b.start_utc);
  const dateLabel = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: b.host_tz });
  const timeLabel = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: b.host_tz });
  const endLabel = new Date(b.end_utc).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: b.host_tz });
  const canceled = b.status === "canceled";

  return (
    <div className="min-h-screen bg-mist/40 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white p-8 card-shadow">
          <div className="text-center">
            <div className={"mx-auto flex h-11 w-11 items-center justify-center rounded-full " + (canceled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
              {canceled ? "✕" : "✓"}
            </div>
            <h1 className="mt-4 text-[24px] font-semibold tracking-tight">{canceled ? "This event was canceled" : "You are scheduled!"}</h1>
            <p className="mt-1 text-[13.5px] text-muted">
              {canceled ? "The host and invitee have been notified." : "A calendar invitation has been sent to your email address."}
            </p>
          </div>

          <div className="mt-7 rounded-xl border border-line p-5">
            <p className="text-[16px] font-semibold">{b.title}</p>
            <div className="mt-3 space-y-2 text-[13.5px] text-muted">
              <p className="flex items-center gap-2">👤 {b.host_name}</p>
              <p className="flex items-center gap-2">🗓 {dateLabel}</p>
              <p className="flex items-center gap-2">◷ {timeLabel} – {endLabel} ({b.host_tz})</p>
              {b.location && <p className="flex items-center gap-2">⌖ {b.location}</p>}
            </div>
          </div>

          {(b.payment_status === "unpaid" || b.payment_status === "paid") && (
            <div className={"mt-4 rounded-xl border p-4 text-[13px] " + (b.payment_status === "paid" ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900")}>
              {b.payment_status === "paid" ? (
                <p>Payment received: {(b.currency || "usd").toUpperCase()} {((b.amount_cents || 0) / 100).toFixed(2)}</p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>Payment due: {b.currency.toUpperCase()} {((b.amount_cents || 0) / 100).toFixed(2)}</p>
                  <Link href={"/booking/" + b.id + "/pay"} className="rounded-lg bg-navy px-3 py-1.5 text-[12px] font-semibold text-white">Pay now</Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 rounded-xl bg-mist/60 p-4 text-[13px] text-navy/80">
            <p><span className="font-medium">Invitee:</span> {b.invitee_name} ({b.invitee_email})</p>
            {b.notes && <p className="mt-1"><span className="font-medium">Notes:</span> {b.notes}</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <a href={"/api/ics/" + b.id} className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-medium text-navy hover:border-navy/30">
              Add to calendar (.ics)
            </a>
            {!canceled && (
              <form action={cancelBookingAction}>
                <input type="hidden" name="id" value={b.id} />
                <button className="rounded-lg border border-red-200 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50">
                  Cancel event
                </button>
              </form>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-[12.5px] text-muted">
          <Link href={"/" + b.username} className="font-medium text-brand hover:underline">Book another time</Link> · Powered by calcal
        </p>
      </div>
    </div>
  );
}