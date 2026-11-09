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
};

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = db
    .prepare(
      `SELECT b.id, b.invitee_name, b.invitee_email, b.start_utc, b.end_utc, b.status, e.title, e.duration
       FROM bookings b JOIN event_types e ON e.id = b.event_type_id
       WHERE b.host_id = ? ORDER BY b.start_utc DESC LIMIT 100`
    )
    .all(user.id) as Row[];

  const now = Date.now();
  const upcoming = rows.filter((r) => r.status === "confirmed" && new Date(r.start_utc).getTime() >= now).reverse();
  const past = rows.filter((r) => !(r.status === "confirmed" && new Date(r.start_utc).getTime() >= now));

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: user.timezone });

  return (
    <div className="max-w-3xl">
      <h1 className="text-[26px] font-semibold tracking-tight">Bookings</h1>
      <p className="mt-1 text-[14px] text-muted">Meetings booked with you, in {user.timezone}.</p>

      <h2 className="mt-7 text-[13px] font-semibold uppercase tracking-wide text-muted">Upcoming</h2>
      {upcoming.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-line bg-white p-8 text-center text-[14px] text-muted">
          No upcoming meetings. Share your link to get booked.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {upcoming.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-5">
              <div>
                <p className="text-[15px] font-semibold">{b.title} <span className="font-normal text-muted">with {b.invitee_name}</span></p>
                <p className="mt-1 text-[13px] text-muted">{fmt(b.start_utc)} · {b.duration} min · {b.invitee_email}</p>
              </div>
              <div className="flex gap-2">
                <Link href={"/booking/" + b.id} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium">View</Link>
                <form action={cancelBookingAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 text-[12.5px] font-medium text-red-600">Cancel</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-muted">Past & canceled</h2>
      <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
        {past.length === 0 && <p className="p-5 text-[13.5px] text-muted">Nothing yet.</p>}
        {past.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 p-4">
            <p className="text-[13.5px]">
              <span className="font-medium">{b.title}</span> with {b.invitee_name}
              <span className="text-muted"> · {fmt(b.start_utc)}</span>
            </p>
            <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (b.status === "canceled" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600")}>
              {b.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
