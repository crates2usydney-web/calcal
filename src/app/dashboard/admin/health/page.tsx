import { db } from "@/lib/db";
import { requireOwner } from "@/lib/admin";
import { providerStatuses } from "@/lib/provider-status";

export default async function AdminHealth() {
  const owner = await requireOwner();
  const providers = providerStatuses();
  const live = providers.filter((p) => p.mode === "live").length;

  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const deliveries = db.prepare("SELECT status, COUNT(*) AS n FROM webhook_deliveries WHERE user_id = ? AND created_at >= ? GROUP BY status").all(owner.id, since) as { status: string; n: number }[];
  const dTotal = deliveries.reduce((a, b) => a + b.n, 0);
  const dOk = deliveries.filter((d) => d.status === "delivered").reduce((a, b) => a + b.n, 0);
  const dFail = deliveries.filter((d) => d.status === "failed").reduce((a, b) => a + b.n, 0);
  const rate = dTotal ? Math.round((dOk / dTotal) * 100) : 100;

  const emails = db.prepare("SELECT status, COUNT(*) AS n FROM emails WHERE user_id = ? GROUP BY status").all(owner.id) as { status: string; n: number }[];
  const emailCount = (s: string) => emails.find((e) => e.status === s)?.n ?? 0;

  const conns = db.prepare("SELECT provider, account_email, expires_at FROM oauth_connections WHERE user_id = ? ORDER BY provider").all(owner.id) as { provider: string; account_email: string; expires_at: string }[];
  const hooks = db.prepare("SELECT id, url, active FROM webhook_endpoints WHERE user_id = ?").all(owner.id) as { id: string; url: string; active: number }[];

  const cron = providers.find((p) => /reminder|cron/i.test(p.id + " " + p.name));

  const badge = (mode: string) => mode === "live" ? "bg-green-50 text-green-700" : mode === "demo" ? "bg-amber-50 text-amber-700" : "bg-cloud text-muted";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Providers live", live + " / " + providers.length],
          ["Webhook success", rate + "%"],
          ["Reminders sent", String(emailCount("sent"))],
          ["Reminder queue", String(emailCount("scheduled"))],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">{l}</p>
            <p className="mt-1.5 text-[20px] font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">Integration providers</h2>
        <ul className="mt-3 divide-y divide-line">
          {providers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-[13px] font-medium">{p.name}</p>
                <p className="text-[11.5px] text-muted">{p.detail}</p>
              </div>
              <span className={"rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase " + badge(p.mode)}>{p.mode}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-[13.5px] font-semibold">Webhook deliveries · 7 days</h2>
          <dl className="mt-3 space-y-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-muted">Total</dt><dd>{dTotal}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivered</dt><dd className="text-green-700">{dOk}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Failed</dt><dd className="text-red-600">{dFail}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Endpoints</dt><dd>{hooks.length} ({hooks.filter((h) => h.active).length} active)</dd></div>
          </dl>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cloud"><div className="h-full rounded-full bg-brand" style={{ width: rate + "%" }} /></div>
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-[13.5px] font-semibold">Reminder scheduler</h2>
          <dl className="mt-3 space-y-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-muted">Cron secret</dt><dd>{cron?.mode === "live" ? "Configured" : "Not set"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Scheduled</dt><dd>{emailCount("scheduled")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Sent</dt><dd>{emailCount("sent")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Failed</dt><dd>{emailCount("failed")}</dd></div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">Calendar connections</h2>
        {conns.length === 0 ? <p className="mt-2 text-[12.5px] text-muted">No provider connected yet.</p> : (
          <ul className="mt-3 divide-y divide-line">
            {conns.map((c) => (
              <li key={c.provider} className="flex items-center justify-between py-2 text-[13px]">
                <span className="font-medium">{c.provider}</span>
                <span className="text-muted">{c.account_email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
