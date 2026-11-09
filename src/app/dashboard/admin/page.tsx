import Link from "next/link";
import { db } from "@/lib/db";
import { listMembers, planLimits, requireOwner, seatUsage } from "@/lib/admin";

export default async function AdminOverview() {
  const owner = await requireOwner();
  const seats = seatUsage(owner.id);
  const limits = planLimits(owner.plan);
  const members = listMembers(owner.id);

  const bookings = (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE host_id = ?").get(owner.id) as { n: number }).n;
  const polls = (db.prepare("SELECT COUNT(*) AS n FROM polls WHERE user_id = ?").get(owner.id) as { n: number }).n;
  const routing = (db.prepare("SELECT COUNT(*) AS n FROM routing_submissions s JOIN routing_forms f ON f.id = s.form_id WHERE f.user_id = ?").get(owner.id) as { n: number }).n;
  const hooks = (db.prepare("SELECT COUNT(*) AS n FROM webhook_endpoints WHERE user_id = ?").get(owner.id) as { n: number }).n;
  const audit = (db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE owner_id = ?").get(owner.id) as { n: number }).n;
  const connected = (db.prepare("SELECT COUNT(*) AS n FROM oauth_connections WHERE user_id = ?").get(owner.id) as { n: number }).n;

  const cards = [
    { label: "Plan", value: limits.name, sub: seats.seatsUsed + " of " + (limits.seats === Infinity ? "∞" : limits.seats) + " seats used", href: "/dashboard/admin/plan" },
    { label: "Bookings", value: String(bookings), sub: "lifetime, all hosts", href: "/dashboard/admin/usage" },
    { label: "Calendar connections", value: String(connected), sub: "Google / Microsoft", href: "/dashboard/admin/health" },
    { label: "Audit events", value: String(audit), sub: "owner actions logged", href: "/dashboard/admin/audit" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-xl border border-line bg-white p-4 transition hover:border-brand/40">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">{c.label}</p>
            <p className="mt-2 text-[24px] font-semibold tracking-tight">{c.value}</p>
            <p className="mt-0.5 text-[12px] text-muted">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13.5px] font-semibold">Team</h2>
            <Link href="/dashboard/admin/members" className="text-[12px] font-medium text-brand">Manage →</Link>
          </div>
          <p className="mt-1 text-[12px] text-muted">{members.length} invited · {seats.activeMembers} active</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between text-[13px]"><span>{owner.name} <span className="text-muted">(you)</span></span><span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold uppercase text-brand">Owner</span></li>
            {members.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center justify-between text-[13px]">
                <span>{m.name} <span className="text-muted">{m.email}</span></span>
                <span className="rounded-full bg-cloud px-2 py-0.5 text-[10.5px] font-semibold uppercase text-muted">{m.role}</span>
              </li>
            ))}
            {members.length === 0 && <li className="text-[12.5px] text-muted">No teammates yet — invite one from Members &amp; roles.</li>}
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13.5px] font-semibold">Plan limits</h2>
            <Link href="/dashboard/admin/plan" className="text-[12px] font-medium text-brand">Upgrade →</Link>
          </div>
          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex justify-between"><dt className="text-muted">Seats</dt><dd className="font-medium">{seats.seatsUsed} / {limits.seats === Infinity ? "∞" : limits.seats}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Event types</dt><dd className="font-medium">{limits.eventTypes === Infinity ? "Unlimited" : limits.eventTypes}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Monthly</dt><dd className="font-medium">${(limits.price / 100).toFixed(0)} / seat</dd></div>
          </dl>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cloud">
            <div className="h-full rounded-full bg-brand" style={{ width: Math.min(100, Math.round((seats.seatsUsed / (limits.seats === Infinity ? seats.seatsUsed : limits.seats)) * 100)) + "%" }} />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">Workspace activity</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {[["Meeting polls", polls], ["Routing submissions", routing], ["Webhook endpoints", hooks], ["Audit events", audit]].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-cloud/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-1 text-[20px] font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
