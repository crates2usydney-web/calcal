import Link from "next/link";
import { Logo } from "@/components/Logo";
import { COMPARISON, PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth";
import { setPlanAction } from "@/lib/actions";

function Cell({ v, col }: { v: string; col: number }) {
  if (v === "+") return <span className="text-[16px] font-semibold text-brand">✓</span>;
  if (v === "-") return <span className="text-[14px] text-navy/25">–</span>;
  if (v === "P") return <span className="rounded bg-mist px-2 py-0.5 text-[10.5px] font-semibold text-brand">{col === 1 ? "Standard Plus" : "Teams Plus"}</span>;
  if (v === "A") return <span className="rounded bg-gray-100 px-2 py-0.5 text-[10.5px] font-medium text-gray-600">Add-on</span>;
  return <span className="text-[12.5px] text-navy/80">{v}</span>;
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <div className="bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg border border-navy/15 px-4 py-2 text-[14px] font-medium text-navy">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-navy px-4 py-2 text-[14px] font-medium text-white">Get started free</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">Pricing</p>
          <h1 className="mt-2 text-[38px] font-semibold tracking-tight md:text-[48px]">Choose a plan that fits</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">
            Start free. Upgrade when you need unlimited event types, reminders, payments or team scheduling.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-line p-1 text-[12.5px] font-medium">
            <span className="rounded-full bg-navy px-4 py-1.5 text-white">Bill yearly (save up to 25%)</span>
            <span className="px-4 py-1.5 text-muted">Bill monthly</span>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.id} className={"flex flex-col rounded-2xl border p-6 " + (p.highlight ? "border-brand ring-2 ring-brand/20" : "border-line")}>
              {p.highlight && <span className="mb-2 self-start rounded-full bg-brand px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white">Popular</span>}
              <p className="text-[12px] font-semibold uppercase tracking-widest text-muted">{p.name}</p>
              <p className="mt-2 text-[34px] font-semibold">{p.annual}</p>
              <p className="text-[12px] text-muted">{p.note}</p>
              <p className="mt-3 min-h-[36px] text-[12.5px] leading-relaxed text-navy/70">{p.blurb}</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-[13px] text-navy/80">
                {p.items.map((i) => <li key={i} className="flex gap-2"><span className="text-brand">✓</span>{i}</li>)}
              </ul>
              {user ? (
                user.plan === p.id ? (
                  <div className="mt-6 rounded-lg border border-line bg-mist py-2.5 text-center text-[13px] font-semibold text-brand">Current plan</div>
                ) : (
                  <form action={setPlanAction}>
                    <input type="hidden" name="plan" value={p.id} />
                    <button className={"mt-6 w-full rounded-lg py-2.5 text-center text-[13px] font-semibold " + (p.highlight ? "bg-brand text-white hover:bg-brand-dark" : "border border-navy/15 text-navy hover:border-navy/40")}>
                      {p.id === "business" ? "Talk to sales" : "Switch to " + p.name}
                    </button>
                  </form>
                )
              ) : (
                <Link href={"/signup?plan=" + p.id}
                  className={"mt-6 rounded-lg py-2.5 text-center text-[13px] font-semibold " + (p.highlight ? "bg-brand text-white hover:bg-brand-dark" : "border border-navy/15 text-navy hover:border-navy/40")}>
                  {p.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-[22px] font-semibold tracking-tight">Compare all features</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-mist/40 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-4">Feature</th>
                  <th className="px-4 py-4 text-center">Free</th>
                  <th className="px-4 py-4 text-center">Pro</th>
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
          <p className="mt-3 text-[12px] text-muted">
            Prices in USD. Annual billing shown. Plans can be switched instantly in this demo — no card required.
          </p>
        </div>

        <div className="mt-16 rounded-3xl bg-navy px-8 py-12 text-center text-white">
          <h2 className="text-[28px] font-semibold tracking-tight md:text-[36px]">Start free, upgrade when it pays off</h2>
          <p className="mx-auto mt-3 max-w-lg text-[14.5px] text-white/70">No credit card required. Cancel anytime.</p>
          <Link href="/signup" className="mt-7 inline-block rounded-xl bg-white px-7 py-3 text-[14px] font-semibold text-brand">Create free account</Link>
        </div>
      </section>
    </div>
  );
}

function FragmentGroup({ group }: { group: (typeof COMPARISON)[number] }) {
  return (
    <>
      <tr className="border-b border-line bg-white">
        <td colSpan={5} className="px-5 pb-2 pt-6 text-[12px] font-semibold uppercase tracking-widest text-brand">{group.name}</td>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.label} className="border-b border-line/70 last:border-0">
          <td className="px-5 py-3 text-[13.5px] text-navy/85">{r.label}</td>
          {r.values.map((v, i) => (
            <td key={i} className="px-4 py-3 text-center"><Cell v={v} col={i} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}