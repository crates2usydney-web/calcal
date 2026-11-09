import Link from "next/link";
import { saveEventTypeAction } from "@/lib/actions";
import { canUsePayments, canUseRoundRobin } from "@/lib/plans";

type Initial = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  duration?: number;
  location?: string;
  color?: string;
  assignment?: string;
  hostIds?: string[];
  price_cents?: number;
  currency?: string;
  require_payment?: number;
};

type TeamMember = { id: string; name: string; email: string };

const COLORS = ["#7C3AED", "#0069FF", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];

export function EventTypeForm({ initial, team, plan }: { initial?: Initial; team: TeamMember[]; plan: string }) {
  const i = initial ?? {};
  const canRR = canUseRoundRobin(plan);
  const canPay = canUsePayments(plan);
  const assignment = i.assignment === "round_robin" ? "round_robin" : "solo";
  const hostIds = i.hostIds ?? [];

  return (
    <form action={saveEventTypeAction} className="space-y-6">
      {i.id && <input type="hidden" name="id" value={i.id} />}
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[15px] font-semibold">Event type</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Title</label>
            <input name="title" required defaultValue={i.title ?? ""} placeholder="30 Minute Meeting"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Duration</label>
              <select name="duration" defaultValue={String(i.duration ?? 30)} className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px]">
                {[15, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Location</label>
              <input name="location" defaultValue={i.location ?? ""} placeholder="Zoom, phone, or address"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Description</label>
            <textarea name="description" rows={3} defaultValue={i.description ?? ""} placeholder="What is this meeting about?"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Link slug</label>
              <input name="slug" defaultValue={i.slug ?? ""} placeholder="30min"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Color</label>
              <select name="color" defaultValue={i.color ?? COLORS[0]} className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px]">
                {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Hosts & assignment</h2>
          {!canRR && <span className="rounded-full bg-mist px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-brand">Teams feature</span>}
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          Round robin distributes bookings across the selected team members based on who is free and who has the fewest upcoming meetings.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={"flex cursor-pointer items-start gap-3 rounded-xl border p-4 " + (assignment === "solo" ? "border-brand ring-1 ring-brand/30" : "border-line")}>
            <input type="radio" name="assignment" value="solo" defaultChecked={assignment === "solo"} className="mt-1 accent-[#0069ff]" />
            <span>
              <span className="block text-[13.5px] font-medium">One host</span>
              <span className="block text-[12px] text-muted">You host every booking.</span>
            </span>
          </label>
          <label className={"flex cursor-pointer items-start gap-3 rounded-xl border p-4 " + (assignment === "round_robin" ? "border-brand ring-1 ring-brand/30" : "border-line") + (canRR ? "" : " opacity-60")}>
            <input type="radio" name="assignment" value="round_robin" defaultChecked={assignment === "round_robin"} disabled={!canRR} className="mt-1 accent-[#0069ff]" />
            <span>
              <span className="block text-[13.5px] font-medium">Round robin</span>
              <span className="block text-[12px] text-muted">{canRR ? "Rotate across hosts fairly." : "Upgrade to Teams to enable."}</span>
            </span>
          </label>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">Payments</p>
            {!canPay && <span className="rounded-full bg-mist px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-brand">Pro feature</span>}
          </div>
          <p className="text-[12px] text-muted">Charge invitees when they book. Requires Stripe (or demo mode).</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1 block text-[12px] font-medium">Price</label>
              <input name="price" type="number" min="0" step="0.01" defaultValue={((i.price_cents ?? 0) / 100).toFixed(2)} disabled={!canPay}
                className="w-full rounded-lg border border-line px-3 py-2 text-[13.5px] disabled:bg-gray-50" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium">Currency</label>
              <select name="currency" defaultValue={i.currency ?? "usd"} disabled={!canPay} className="w-full rounded-lg border border-line px-3 py-2 text-[13.5px] disabled:bg-gray-50">
                {["usd", "eur", "gbp", "cad", "aud"].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-[12.5px]">
            <input type="checkbox" name="require_payment" defaultChecked={i.require_payment === 1} disabled={!canPay} className="h-4 w-4 accent-[#0069ff]" />
            Require payment at booking
          </label>
          {!canPay && <p className="mt-1 text-[11.5px] text-muted"><Link href="/pricing" className="font-medium text-brand">Upgrade to Pro</Link> to charge for meetings.</p>}
        </div>

        <div className="mt-5">
          <p className="text-[13px] font-medium">Hosts</p>
          <p className="text-[12px] text-muted">Only used when round robin is selected.</p>
          <div className="mt-2 space-y-2">
            {team.map((m) => (
              <label key={m.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                <input type="checkbox" name="hosts" value={m.id} defaultChecked={hostIds.includes(m.id)} disabled={!canRR} className="h-4 w-4 accent-[#0069ff]" />
                <span className="text-[13.5px]">{m.name} <span className="text-[12px] text-muted">({m.email})</span></span>
              </label>
            ))}
          </div>
          {!canRR && <p className="mt-2 text-[12px] text-muted"><Link href="/pricing" className="font-medium text-brand">Upgrade to Teams</Link> to select multiple hosts.</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-[13.5px] font-medium text-muted hover:text-navy">Cancel</Link>
        <button className="rounded-lg bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-soft">
          {i.id ? "Save changes" : "Create event type"}
        </button>
      </div>
    </form>
  );
}