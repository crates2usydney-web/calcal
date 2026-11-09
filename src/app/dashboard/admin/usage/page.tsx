import { db } from "@/lib/db";
import { requireOwner } from "@/lib/admin";

export default async function AdminUsage() {
  const owner = await requireOwner();
  const members = db.prepare("SELECT member_id FROM team_members WHERE owner_id = ?").all(owner.id) as { member_id: string }[];
  const hostIds = [owner.id, ...members.map((m) => m.member_id)];
  const ph = hostIds.map(() => "?").join(",");

  const totalBookings = (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE host_id IN (" + ph + ")").get(...hostIds) as { n: number }).n;
  const upcoming = (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE host_id IN (" + ph + ") AND start_utc >= ? AND status = 'confirmed'").get(...hostIds, new Date().toISOString()) as { n: number }).n;
  const cancelled = (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE host_id IN (" + ph + ") AND status != 'confirmed'").get(...hostIds) as { n: number }).n;
  const noShows = (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE host_id IN (" + ph + ") AND status = 'no_show'").get(...hostIds) as { n: number }).n;
  const polls = (db.prepare("SELECT COUNT(*) AS n FROM polls WHERE user_id = ?").get(owner.id) as { n: number }).n;
  const routing = (db.prepare("SELECT COUNT(*) AS n FROM routing_submissions s JOIN routing_forms f ON f.id = s.form_id WHERE f.user_id = ?").get(owner.id) as { n: number }).n;

  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const daily = db.prepare(
    "SELECT substr(start_utc, 1, 10) AS day, COUNT(*) AS n FROM bookings WHERE host_id IN (" + ph + ") AND created_at >= ? GROUP BY day ORDER BY day ASC"
  ).all(...hostIds, since) as { day: string; n: number }[];

  const days: { day: string; n: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    days.push({ day: d, n: daily.find((r) => r.day === d)?.n ?? 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.n));

  const top = db.prepare(
    "SELECT e.title, e.color, COUNT(b.id) AS n FROM event_types e LEFT JOIN bookings b ON b.event_type_id = e.id WHERE e.user_id = ? GROUP BY e.id ORDER BY n DESC, e.title ASC LIMIT 6"
  ).all(owner.id) as { title: string; color: string; n: number }[];

  const stats = [
    ["Total bookings", String(totalBookings)],
    ["Upcoming", String(upcoming)],
    ["Cancelled", String(cancelled)],
    ["No-shows", String(noShows)],
    ["Meeting polls", String(polls)],
    ["Routing submissions", String(routing)],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">{l}</p>
            <p className="mt-1.5 text-[22px] font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">Bookings · last 30 days</h2>
        <p className="text-[12px] text-muted">{days.reduce((a, b) => a + b.n, 0)} bookings created in this window</p>
        <div className="mt-4 flex h-40 items-end gap-1">
          {days.map((d) => (
            <div key={d.day} className="group relative flex-1" title={d.day + ": " + d.n}>
              <div className="w-full rounded-t bg-brand/70 transition group-hover:bg-brand" style={{ height: Math.max(2, Math.round((d.n / max) * 140)) + "px" }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10.5px] text-muted"><span>{days[0]?.day}</span><span>Today</span></div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">Top event types</h2>
        <ul className="mt-3 space-y-2.5">
          {top.map((t) => (
            <li key={t.title} className="flex items-center gap-3 text-[13px]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color || "#7C3AED" }} />
              <span className="flex-1">{t.title}</span>
              <span className="w-40 overflow-hidden rounded-full bg-cloud">
                <span className="block h-1.5 rounded-full bg-brand" style={{ width: (totalBookings ? Math.max(4, Math.round((t.n / Math.max(1, top[0].n)) * 100)) : 4) + "%" }} />
              </span>
              <span className="w-8 text-right font-medium">{t.n}</span>
            </li>
          ))}
          {top.length === 0 && <li className="text-[12.5px] text-muted">No event types yet.</li>}
        </ul>
      </section>
    </div>
  );
}
