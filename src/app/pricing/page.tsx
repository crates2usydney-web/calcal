import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { COMPARISON, PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth";
import { setPlanAction } from "@/lib/actions";

function Cell({ v, col }: { v: string; col: number }) {
  if (v === "+") return <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">✓</span>;
  if (v === "-") return <span className="text-[14px] text-[#c3cfdd]">–</span>;
  if (v === "P") return <span className="rounded bg-brand-soft px-2 py-0.5 text-[10.5px] font-semibold text-brand">{col === 1 ? "Standard Plus" : "Teams Plus"}</span>;
  if (v === "A") return <span className="rounded bg-[#f1f4f8] px-2 py-0.5 text-[10.5px] font-medium text-muted">Add-on</span>;
  return <span className="text-[12.5px] text-ink/80">{v}</span>;
}

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="bg-white">
      <SiteNav />

      <section className="border-b border-line bg-cloud">
        <div className="container-x py-12 text-center">
          <p className="eyebrow">Plans & pricing</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[48px]">
            A plan for every kind of scheduling
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
            Start free and upgrade when you need unlimited event types, reminders, payments or team routing.
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-line bg-white p-1 text-[13px] font-medium">
            <span className="rounded-full bg-ink px-4 py-2 text-white">Bill annually</span>
            <span className="px-4 py-2 text-muted">Bill monthly</span>
          </div>
          <p className="mt-3 text-[12px] text-muted">Save up to 25% with annual billing</p>
        </div>
      </section>

      <section className="container-x -mt-2 py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={
                "relative flex flex-col rounded-2xl border bg-white p-6 " + (p.highlight ? "pt-8 " : "") +
                (p.highlight ? "border-brand shadow-card ring-1 ring-brand/20" : "border-line")
              }
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <p className="text-[14px] font-semibold text-ink">{p.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[38px] font-semibold tracking-tight">{p.annual}</span>
                <span className="text-[12px] text-muted">/seat/mo</span>
              </div>
              <p className="mt-1 text-[12px] text-muted">{p.note}</p>
              <p className="mt-4 min-h-[40px] text-[13px] leading-relaxed text-muted">{p.blurb}</p>

              {user ? (
                user.plan === p.id ? (
                  <div className="mt-5 rounded-full border border-line bg-cloud py-2.5 text-center text-[13px] font-semibold text-brand">Current plan</div>
                ) : (
                  <form action={setPlanAction} className="mt-5">
                    <input type="hidden" name="plan" value={p.id} />
                    <button className={"w-full rounded-full py-2.5 text-[13px] font-semibold " + (p.highlight ? "bg-brand text-white hover:bg-brand-dark" : "border border-ink/15 text-ink hover:border-ink/40")}>
                      {p.id === "business" ? "Talk to sales" : "Switch to " + p.name}
                    </button>
                  </form>
                )
              ) : (
                <Link
                  href={"/signup?plan=" + p.id}
                  className={"mt-5 rounded-full py-2.5 text-center text-[13px] font-semibold " + (p.highlight ? "bg-brand text-white hover:bg-brand-dark" : "border border-ink/15 text-ink hover:border-ink/40")}
                >
                  {p.cta}
                </Link>
              )}

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted/80">Includes</p>
                <ul className="mt-3 space-y-2">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink/85">
                      <span className="mt-0.5 text-brand">✓</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-muted">Prices in USD. Plans can be switched instantly in this demo — no card required.</p>
      </section>

      <section className="border-y border-line bg-cloud py-16">
        <div className="container-x">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-[26px] font-semibold tracking-tight md:text-[32px]">Compare all features</h2>
              <p className="mt-2 text-[14px] text-muted">Everything in every plan, side by side.</p>
            </div>
            <Link href="/signup" className="btn btn-primary">Start free</Link>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[12px] font-semibold text-muted">
                  <th className="sticky left-0 z-10 bg-white px-5 py-4">Feature</th>
                  <th className="px-4 py-4 text-center">Free</th>
                  <th className="px-4 py-4 text-center text-brand">Pro</th>
                  <th className="px-4 py-4 text-center">Teams</th>
                  <th className="px-4 py-4 text-center">Business</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((g) => (
                  <FragmentGroup key={g.name} group={g} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight md:text-[34px]">Questions, answered</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Still unsure which plan fits? Start free — you can move up whenever you need more.
            </p>
            <Link href="/docs/api" className="mt-5 inline-block text-[13.5px] font-semibold text-brand">Read the docs →</Link>
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {[
              ["Can I use calcal for free?", "Yes. The Free plan includes three event types, unlimited one-on-one bookings and your own booking page. No credit card required."],
              ["What happens when I upgrade?", "Your event types, bookings and settings stay exactly as they are. New limits and features unlock immediately."],
              ["Do you support team scheduling?", "Round-robin, collective and group events are available on Teams and above, along with shared availability."],
              ["Are payments included?", "Payments and Stripe checkout are part of Pro. You can charge a deposit or the full amount per event type."],
              ["Can I cancel anytime?", "Yes. Plans are month to month unless you choose annual billing, and you can downgrade whenever you like."],
            ].map(([q, a]) => (
              <details key={q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14.5px] font-semibold text-ink">
                  {q}
                  <span className="text-[18px] font-light text-muted group-open:hidden">+</span>
                  <span className="hidden text-[18px] font-light text-muted group-open:inline">−</span>
                </summary>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FragmentGroup({ group }: { group: (typeof COMPARISON)[number] }) {
  return (
    <>
      <tr className="border-b border-line bg-cloud/60">
        <td colSpan={5} className="sticky left-0 z-10 bg-cloud/60 px-5 pb-2 pt-5 text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand">
          {group.name}
        </td>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.label} className="border-b border-line/70 last:border-0">
          <td className="sticky left-0 z-10 bg-white px-5 py-3 text-[13.5px] text-ink/85">{r.label}</td>
          {r.values.map((v, i) => (
            <td key={i} className="px-4 py-3 text-center"><Cell v={v} col={i} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}