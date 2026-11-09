import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelBookingAction } from "@/lib/actions";

type Row = {
  id: string;
  invitee_name: string;
  invitee_email: string;
  start_utc: string;
  end_utc: string;
  status: string;
  title: string;
  duration: number;
  amount_cents: number;
  currency: string;
  payment_status: string;
};

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { tab } = await searchParams;
  const view = tab === "past" ? "past" : "upcoming";

  const rows = db
    .prepare(
      "SELECT b.id, b.invitee_name, b.invitee_email, b.start_utc, b.end_utc, b.status, e.title, e.duration, b.amount_cents, e.currency AS currency, b.payment_status " +
      "FROM bookings b JOIN event_types e ON e.id = b.event_type_id WHERE b.host_id = ? ORDER BY b.start_utc DESC LIMIT 200"
    )
    .all(user.id) as Row[];

  const now = Date.now();
  const upcoming = rows.filter((r) => r.status === "confirmed" && new Date(r.start_utc).getTime() >= now).reverse();
  const past = rows.filter((r) => !(r.status === "confirmed" && new Date(r.start_utc).getTime() >= now));
  const list = view === "upcoming" ? upcoming : past;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: user.timezone });

  const money = (cents: number, currency: string) =>
    cents > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "usd").toUpperCase() }).format(cents / 100) : "";

  return (
    <div className="max-w-4xl">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Bookings</h1>
      <p className="mt-1 text-[13.5px] text-muted">Meetings booked with you, shown in {user.timezone}.</p>

      <div className="mt-5 flex items-center gap-6 border-b border-line text-[13.5px] font-medium">
        <Link href="/dashboard/bookings" className={"pb-3 " + (view === "upcoming" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink")}>
          Upcoming {upcoming.length ? "(" + upcoming.length + ")" : ""}
        </Link>
        <Link href="/dashboard/bookings?tab=past" className={"pb-3 " + (view === "past" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink")}>
          Past & canceled
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-14 text-center">
          <p className="text-[16px] font-semibold">{view === "upcoming" ? "No upcoming meetings" : "Nothing here yet"}</p>
          <p className="mt-1 text-[13.5px] text-muted">
            {view === "upcoming" ? "Share your booking link to get booked." : "Past and canceled bookings will appear here."}
          </p>
          {view === "upcoming" && <a href={"/" + user.username} className="btn btn-primary mt-5">View booking page</a>}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {list.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
                  {b.invitee_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-[14.5px] font-semibold">{b.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted">{b.invitee_name} · {b.invitee_email}</p>
                  <p className="mt-1 text-[12.5px] text-ink/80">{fmt(b.start_utc)} · {b.duration} min</p>
                  {b.amount_cents > 0 && (
                    <span className={"mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium " + (b.payment_status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                      {b.payment_status === "paid" ? "Paid " : "Unpaid "}{money(b.amount_cents, b.currency)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (b.status === "canceled" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700")}>
                  {b.status}
                </span>
                <Link href={"/booking/" + b.id} className="btn btn-outline">View</Link>
                {view === "upcoming" && (
                  <form action={cancelBookingAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="rounded-full border border-red-200 px-4 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50">Cancel</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}