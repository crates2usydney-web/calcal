import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AppPreview } from "@/components/site/AppPreview";

const logos = ["ACME", "NORTHWIND", "GLOBEX", "INITECH", "UMBRELLA", "HOOPS"];

const cards = [
  {
    title: "Scheduling",
    body: "Share one link. Invitees pick a time that works for both of you, in their own timezone.",
    art: (
      <div className="space-y-2">
        {["9:00am", "9:30am", "10:00am"].map((t, i) => (
          <div key={t} className={"rounded-md border py-1.5 text-center text-[11.5px] " + (i === 1 ? "border-brand bg-brand text-white" : "border-line text-ink")}>{t}</div>
        ))}
      </div>
    ),
  },
  {
    title: "Payments",
    body: "Take a deposit or the full fee at booking. Money lands before the meeting starts.",
    art: (
      <div className="rounded-lg border border-line p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold">Consultation</p>
          <p className="text-[11px] font-semibold">$120.00</p>
        </div>
        <div className="mt-2 rounded-md bg-brand py-1.5 text-center text-[10.5px] font-semibold text-white">Pay with card</div>
        <p className="mt-2 text-center text-[9.5px] text-muted">Secured by Stripe</p>
      </div>
    ),
  },
  {
    title: "Reminders",
    body: "Automatic email and SMS nudges before every meeting, so fewer people ghost you.",
    art: (
      <div className="space-y-2">
        <div className="rounded-lg border border-line p-2.5">
          <p className="text-[10px] font-semibold">Your meeting is tomorrow</p>
          <p className="mt-0.5 text-[9.5px] text-muted">30 min · 10:00am · Zoom</p>
        </div>
        <div className="rounded-lg border border-line p-2.5 opacity-70">
          <p className="text-[10px] font-semibold">Starting in 1 hour</p>
          <p className="mt-0.5 text-[9.5px] text-muted">Join from your calendar</p>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      <SiteNav />

      <section className="hero-glow">
        <div className="container-x pb-14 pt-14 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-brand shadow-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] text-white">✦</span>
              New · AI scheduling assistant
            </div>
            <h1 className="mt-6 text-[44px] font-semibold leading-[1.03] tracking-[-0.035em] text-ink sm:text-[56px] md:text-[68px]">
              Meetings, handled.
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-muted md:text-[18px]">
              From the first booking link to the final reminder, calcal takes care of the work around meetings so you can focus on the conversation.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary btn-lg">Sign up for free</Link>
              <Link href="/pricing" className="btn btn-outline btn-lg">See plans</Link>
            </div>
            <p className="mt-3.5 text-[12.5px] text-muted">No credit card required · Free forever plan</p>
          </div>

          <div className="mx-auto mt-12 max-w-[1040px]">
            <AppPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white py-9">
        <div className="container-x flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <p className="text-[12.5px] font-medium text-muted">Trusted by 100,000+ teams that run on meetings</p>
          <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
            {logos.map((l) => (
              <span key={l} className="text-[13px] font-bold tracking-[0.18em] text-[#b7c5d6]">{l}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">The platform</p>
          <h2 className="mt-3 text-[34px] font-semibold leading-[1.12] md:text-[44px]">
            Everything before, during and after the meeting
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted">
            One system for booking, payments, reminders and follow-ups — so nothing falls through the cracks.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-line bg-white p-6 transition hover:shadow-[0_12px_32px_rgba(11,53,88,0.10)]">
              <div className="flex h-[150px] flex-col justify-center rounded-xl bg-cloud p-4">{c.art}</div>
              <h3 className="mt-5 text-[18px] font-semibold">{c.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.body}</p>
              <Link href="/signup" className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-brand">
                Learn more <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cloud py-20">
        <div className="container-x grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow">Availability</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] md:text-[40px]">Your calendar stays yours</h2>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
              Set working hours, buffers and minimum notice once. calcal checks every connected calendar before it offers a slot, so you never get double-booked.
            </p>
            <ul className="mt-6 space-y-3">
              {["Connect Google, Outlook and iCloud", "Buffer time between meetings", "Limit bookings per day", "Round-robin across your team"].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold">Weekly hours</p>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">Mon–Fri</span>
            </div>
            <div className="mt-4 space-y-2">
              {[
                ["Monday", "9:00am – 5:00pm"],
                ["Tuesday", "9:00am – 5:00pm"],
                ["Wednesday", "9:00am – 5:00pm"],
                ["Thursday", "10:00am – 4:00pm"],
                ["Friday", "9:00am – 1:00pm"],
              ].map(([d, h]) => (
                <div key={d} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                  <span className="text-[12.5px] font-medium">{d}</span>
                  <span className="text-[12px] text-muted">{h}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-soft px-3 py-2.5">
              <span className="text-[12px] font-semibold text-brand">Buffer after meetings</span>
              <span className="text-[12px] font-semibold text-brand">15 min</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="order-2 rounded-2xl border border-line bg-white p-5 shadow-card md:order-1">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <p className="text-[13px] font-semibold">Checkout</p>
              <span className="text-[11px] text-muted">calcal.app/pay</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold">Strategy session</p>
                <p className="text-[11.5px] text-muted">45 min with Alex Morgan</p>
              </div>
              <p className="text-[16px] font-semibold">$180</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-line px-3 py-2 text-[12px] text-muted">Card number</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-line px-3 py-2 text-[12px] text-muted">MM / YY</div>
                <div className="rounded-lg border border-line px-3 py-2 text-[12px] text-muted">CVC</div>
              </div>
              <div className="rounded-lg bg-brand py-2.5 text-center text-[12.5px] font-semibold text-white">Pay $180</div>
            </div>
            <p className="mt-3 text-center text-[10.5px] text-muted">Payments are processed securely by Stripe.</p>
          </div>

          <div className="order-1 md:order-2">
            <p className="eyebrow">Payments</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] md:text-[40px]">Get paid before the meeting</h2>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
              Charge a deposit or the full amount when someone books. Great for consultants, coaches and anyone whose time is the product.
            </p>
            <ul className="mt-6 space-y-3">
              {["Set a price per event type", "Secure Stripe checkout", "Paid bookings are confirmed instantly", "Refund or cancel from the dashboard"].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="container-x grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fc0ff]">Numbers</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight md:text-[40px]">Less scheduling, more of the work</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
              Teams that move their booking flow to calcal spend less time trading emails and more time in the meetings that matter.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              ["10k+", "meetings booked"],
              ["98%", "reminder delivery"],
              ["65+", "integrations"],
              ["2 min", "to go live"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-[36px] font-semibold tracking-tight">{n}</p>
                <p className="mt-1 text-[13px] text-white/60">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="customers" className="container-x py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-semibold text-brand">Customer story</p>
          <blockquote className="mt-5 text-[26px] font-medium leading-[1.35] tracking-[-0.02em] text-ink md:text-[32px]">
            “We moved four teams onto calcal in a week. The links are simple, the reminders just work, and our no-show rate dropped by a third.”
          </blockquote>
          <div className="mt-7 flex items-center justify-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">JS</span>
            <div className="text-left">
              <p className="text-[13.5px] font-semibold">Jamie Sullivan</p>
              <p className="text-[12.5px] text-muted">Head of Revenue Operations, Northwind</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-cloud py-16">
        <div className="container-x">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Works with your stack</p>
              <h2 className="mt-3 text-[30px] font-semibold md:text-[38px]">65+ integrations, including the ones you already use</h2>
            </div>
            <Link href="/dashboard/integrations" className="text-[14px] font-semibold text-brand hover:underline">Browse integrations →</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Slack", "Zoom", "Google Calendar", "Microsoft Teams", "Salesforce", "Stripe", "HubSpot", "Zapier"].map((n) => (
              <div key={n} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cloud text-[11px] font-bold text-ink">{n.slice(0, 1)}</span>
                <span className="text-[13px] font-medium text-ink">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#0c3f6e] to-[#0b3558] px-8 py-14 text-center text-white md:px-16">
          <h2 className="text-[32px] font-semibold tracking-tight md:text-[42px]">Ready to stop the back-and-forth?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-white/70">Create a free account, add your hours and share your first link in minutes.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn btn-lg bg-white text-ink hover:bg-[#eef4ff]">Get started for free</Link>
            <Link href="/pricing" className="btn btn-lg border border-white/30 text-white hover:bg-white/10">Compare plans</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}