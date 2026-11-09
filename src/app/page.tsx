import Link from "next/link";
import { Logo } from "@/components/Logo";

const features = [
  { icon: "📅", title: "Scheduling", text: "Share a link, let invitees pick a time. Calendar conflicts checked automatically." },
  { icon: "🔁", title: "Routing & polls", text: "Qualify leads with routing forms or find the best time for a group with polls." },
  { icon: "💳", title: "Payments", text: "Charge deposits or full price when someone books. Stripe and PayPal ready." },
  { icon: "🔔", title: "Reminders", text: "Automated email and SMS reminders cut no-shows without the busywork." },
  { icon: "👥", title: "Team scheduling", text: "Round-robin, collective and group events for teams of every size." },
  { icon: "🤖", title: "AI assistant", text: "Draft replies, find times and prep for meetings with your built-in assistant." },
];

const plans = [
  { name: "Free", price: "$0", note: "Always free", items: ["3 event types", "1 calendar connection", "Unlimited 1:1 meetings", "Booking page & polls"] },
  { name: "Pro", price: "$6", note: "per seat/mo, billed yearly", items: ["Unlimited event types", "6 calendars", "Reminders & workflows", "Payments & integrations"], highlight: true },
  { name: "Teams", price: "$11", note: "per seat/mo, billed yearly", items: ["Everything in Pro", "Round-robin & collective", "Routing forms", "Groups & admins"] },
  { name: "Business", price: "$19", note: "per seat/mo, billed yearly", items: ["Everything in Teams", "SSO & SAML", "Audit log & data-deletion API", "Priority support"] },
];

export default function Home() {
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-6 text-[14px] text-navy/80 md:flex">
              <a href="#product" className="hover:text-brand">Product</a>
              <a href="#solutions" className="hover:text-brand">Solutions</a>
              <Link href="/pricing" className="hover:text-brand">Pricing</Link>
              <a href="#resources" className="hover:text-brand">Resources</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg border border-navy/15 px-4 py-2 text-[14px] font-medium text-navy hover:border-navy/40">
              Log in
            </Link>
            <Link href="/signup" className="rounded-lg bg-navy px-4 py-2 text-[14px] font-medium text-white hover:bg-navy-soft">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium">
              <span>✨</span> Now with an AI scheduling assistant
            </div>
            <h1 className="text-[42px] font-semibold leading-[1.05] tracking-tight md:text-[64px]">
              Meetings,<br />handled.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/85">
              From booking links to reminders and payments, calcal handles the work around meetings so you can focus on the conversation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="rounded-xl bg-white px-6 py-3 text-[15px] font-semibold text-brand hover:bg-mist">
                Start for free
              </Link>
              <a href="#pricing" className="rounded-xl border border-white/40 px-6 py-3 text-[15px] font-semibold text-white hover:bg-white/10">
                See plans
              </a>
            </div>
            <p className="mt-3 text-[13px] text-white/70">No credit card required · Free forever plan</p>
          </div>

          <div className="relative">
            <div className="card-shadow mx-auto w-full max-w-md rounded-2xl bg-white p-5">
              <div className="flex items-center gap-3 border-b border-line pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-[15px] font-semibold text-brand">SM</div>
                <div>
                  <p className="text-[15px] font-semibold text-navy">Sam Macneil</p>
                  <p className="text-[12px] text-muted">30 Minute Meeting · 30 min</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
                {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
                {Array.from({ length: 30 }).map((_, i) => {
                  const day = i - 2;
                  const active = day > 0 && day % 7 !== 0 && day % 7 !== 6;
                  return (
                    <div key={i} className={"rounded-md py-1.5 " + (active ? "bg-mist text-brand font-medium" : "text-navy/30")}>
                      {day > 0 && day <= 30 ? day : ""}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2">
                {["9:00am", "9:30am", "10:00am"].map((t, i) => (
                  <div key={t} className={"rounded-lg border py-2 text-center text-[13px] " + (i === 1 ? "border-brand bg-brand text-white" : "border-line text-navy")}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 text-[13px] font-semibold uppercase tracking-widest text-navy/35">
          <span>Trusted by 100,000+ teams</span>
          <span>Acme</span><span>Northwind</span><span>Globex</span><span>Initech</span><span>Umbrella</span>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">The platform</p>
          <h2 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight md:text-[44px]">
            Built for people whose work runs on meetings
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">
            Everything before, during and after the meeting — in one place.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white p-6 hover:card-shadow transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-[18px]">{f.icon}</div>
              <h3 className="mt-4 text-[17px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="solutions" className="bg-mist/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">How it works</p>
            <h2 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight md:text-[40px]">
              From link to booked in under a minute
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
              Set your hours once, share your page, and let calcal do the coordinating.
            </p>
          </div>
          <ol className="space-y-4">
            {[
              ["Set your availability", "Pick the hours you're free. Add buffers and minimum notice so nobody books you back-to-back."],
              ["Share your link", "One page for every event type — 15 minutes, 30, 60, or something custom."],
              ["Get booked", "Invitees pick a slot in their own timezone. Confirmations and reminders go out automatically."],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[14px] font-semibold text-white">{i + 1}</span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">Pricing</p>
            <h2 className="mt-2 text-[34px] font-semibold tracking-tight md:text-[44px]">Choose a plan that fits</h2>
          </div>
          <Link href="/pricing" className="text-[14px] font-medium text-brand hover:underline">Compare all features →</Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div key={p.name} className={"flex flex-col rounded-2xl border p-6 " + (p.highlight ? "border-brand ring-2 ring-brand/20" : "border-line")}>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-muted">{p.name}</p>
              <p className="mt-2 text-[34px] font-semibold">{p.price}</p>
              <p className="text-[12px] text-muted">{p.note}</p>
              <ul className="mt-5 flex-1 space-y-2 text-[13px] text-navy/80">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2"><span className="text-brand">✓</span>{i}</li>
                ))}
              </ul>
              <Link href="/signup" className={"mt-6 rounded-lg py-2.5 text-center text-[13px] font-semibold " + (p.highlight ? "bg-brand text-white hover:bg-brand-dark" : "border border-navy/15 text-navy hover:border-navy/40")}>
                {p.name === "Enterprise" ? "Talk to sales" : "Get started"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20" id="resources">
        <div className="rounded-3xl bg-navy px-8 py-12 text-center text-white md:px-16">
          <h2 className="text-[30px] font-semibold tracking-tight md:text-[40px]">Ready to stop the back-and-forth?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-white/70">Create your free account and share your first link in minutes.</p>
          <Link href="/signup" className="mt-7 inline-block rounded-xl bg-white px-7 py-3 text-[15px] font-semibold text-brand hover:bg-mist">
            Get started for free
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 md:flex-row">
          <Logo />
          <p className="text-[13px] text-muted">© {new Date().getFullYear()} calcal. All rights reserved.</p>
          <div className="flex gap-5 text-[13px] text-muted">
            <a href="#" className="hover:text-navy">Privacy</a>
            <a href="#" className="hover:text-navy">Terms</a>
            <a href="#" className="hover:text-navy">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}