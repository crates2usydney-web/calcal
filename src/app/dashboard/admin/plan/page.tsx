import { db } from "@/lib/db";
import { planLimits, requireOwner, seatUsage } from "@/lib/admin";
import { adminChangePlanAction, createInvoiceAction, markInvoicePaidAction } from "@/lib/admin-actions";
import { PLANS } from "@/lib/plans";

export default async function AdminPlan({ searchParams }: { searchParams: Promise<{ updated?: string; invoice?: string; error?: string }> }) {
  const owner = await requireOwner();
  const { updated, invoice, error } = await searchParams;
  const seats = seatUsage(owner.id);
  const current = planLimits(owner.plan);
  const invoices = db.prepare("SELECT id, number, plan, seats, amount_cents, currency, status, period_start, period_end, created_at FROM invoices WHERE owner_id = ? ORDER BY created_at DESC").all(owner.id) as {
    id: string; number: string; plan: string; seats: number; amount_cents: number; currency: string; status: string; period_start: string; period_end: string; created_at: string;
  }[];

  return (
    <div className="space-y-5">
      {(updated || invoice || error) && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-800">
          {updated === "paid" ? "Invoice marked as paid." : updated ? "Plan updated to " + planLimits(updated).name + "." : ""}
          {invoice ? " Invoice " + invoice + " created." : ""}
          {error ? "That action could not be completed." : ""}
        </div>
      )}

      <section className="rounded-xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[13.5px] font-semibold">Current plan · {current.name}</h2>
            <p className="mt-1 text-[12px] text-muted">{seats.seatsUsed} of {current.seats === Infinity ? "∞" : current.seats} seats used · ${(current.price / 100).toFixed(0)}/seat/mo</p>
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-cloud">
            <div className="h-full rounded-full bg-brand" style={{ width: Math.min(100, Math.round((seats.seatsUsed / (current.seats === Infinity ? seats.seatsUsed : current.seats)) * 100)) + "%" }} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const active = p.id === owner.plan;
            return (
              <div key={p.id} className={"rounded-xl border p-4 " + (active ? "border-brand bg-brand-soft/30" : "border-line bg-white")}>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">{p.name}</p>
                <p className="mt-1 text-[22px] font-semibold">{p.monthly}<span className="text-[12px] font-normal text-muted">/mo</span></p>
                <ul className="mt-2 space-y-1 text-[12px] text-muted">
                  {p.items.slice(0, 3).map((i) => <li key={i}>· {i}</li>)}
                </ul>
                <form action={adminChangePlanAction} className="mt-3">
                  <input type="hidden" name="plan" value={p.id} />
                  <button className={"w-full rounded-lg px-3 py-1.5 text-[12px] font-semibold " + (active ? "bg-white text-brand ring-1 ring-brand/30" : "bg-navy text-white")} disabled={active}>
                    {active ? "Current plan" : "Switch to " + p.name}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11.5px] text-muted">Switching plans updates limits immediately. Payment collection uses the same Stripe keys as checkout — invoices below are Stripe-ready (<code>stripe_id</code> column reserved).</p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">Create invoice</h2>
        <form action={createInvoiceAction} className="mt-3 flex flex-wrap items-end gap-2">
          <div><label className="mb-1 block text-[11.5px] font-medium text-muted">Plan</label>
            <select name="plan" defaultValue={owner.plan} className="input">
              {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="mb-1 block text-[11.5px] font-medium text-muted">Seats</label><input name="seats" type="number" min={1} defaultValue={Math.max(1, seats.seatsUsed)} className="input w-24" /></div>
          <div><label className="mb-1 block text-[11.5px] font-medium text-muted">Months</label><input name="months" type="number" min={1} max={12} defaultValue={1} className="input w-24" /></div>
          <button className="btn btn-outline">Generate invoice</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[13.5px] font-semibold">Invoices</h2>
          <span className="text-[12px] text-muted">{invoices.length} total</span>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead className="bg-cloud/60 text-[11px] uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-2 font-semibold">Number</th><th className="px-4 py-2 font-semibold">Period</th><th className="px-4 py-2 font-semibold">Seats</th><th className="px-4 py-2 font-semibold">Amount</th><th className="px-4 py-2 font-semibold">Status</th><th className="px-4 py-2 text-right font-semibold">Action</th></tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium">{inv.number}</td>
                <td className="px-4 py-2.5 text-muted">{new Date(inv.period_start).toLocaleDateString()} – {new Date(inv.period_end).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">{inv.seats}</td>
                <td className="px-4 py-2.5">${(inv.amount_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-2.5"><span className={"rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase " + (inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>{inv.status}</span></td>
                <td className="px-4 py-2.5 text-right">
                  {inv.status !== "paid" ? (
                    <form action={markInvoicePaidAction}><input type="hidden" name="invoice_id" value={inv.id} /><button className="rounded-md border border-line px-2 py-1 text-[11.5px] font-medium">Mark paid</button></form>
                  ) : <span className="text-[11.5px] text-muted">—</span>}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr className="border-t border-line"><td colSpan={6} className="px-4 py-8 text-center text-muted">No invoices yet. Generate one above.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
