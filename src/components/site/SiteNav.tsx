import Link from "next/link";
import { Logo } from "@/components/Logo";

const menus: { label: string; href?: string; columns: { title: string; items: { label: string; href: string; desc?: string }[] }[] }[] = [
  {
    label: "Product",
    columns: [
      {
        title: "Scheduling",
        items: [
          { label: "Event types", href: "/signup", desc: "One link for every meeting" },
          { label: "Availability", href: "/signup", desc: "Control when you are bookable" },
          { label: "Reminders", href: "/signup", desc: "Cut no-shows automatically" },
        ],
      },
      {
        title: "Automation",
        items: [
          { label: "Payments", href: "/signup", desc: "Collect deposits at booking" },
          { label: "Integrations", href: "/signup", desc: "65+ apps and calendars" },
          { label: "API & webhooks", href: "/docs/api", desc: "Build on the platform" },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    columns: [
      {
        title: "By team",
        items: [
          { label: "Sales", href: "/signup" },
          { label: "Customer success", href: "/signup" },
          { label: "Recruiting", href: "/signup" },
        ],
      },
      {
        title: "By industry",
        items: [
          { label: "Technology", href: "/signup" },
          { label: "Education", href: "/signup" },
          { label: "Healthcare", href: "/signup" },
        ],
      },
    ],
  },
  {
    label: "Teams",
    columns: [
      {
        title: "Scheduling for teams",
        items: [
          { label: "Round robin", href: "/signup", desc: "Route leads to the next rep" },
          { label: "Collective events", href: "/signup", desc: "Book several people at once" },
          { label: "Group events", href: "/signup", desc: "Run webinars and office hours" },
        ],
      },
      {
        title: "Administration",
        items: [
          { label: "Roles & permissions", href: "/signup" },
          { label: "SSO & SCIM", href: "/pricing" },
          { label: "Audit log", href: "/pricing" },
        ],
      },
    ],
  },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/95 backdrop-blur">
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo size={28} />
          <nav className="hidden items-center gap-1 lg:flex">
            {menus.map((m) => (
              <div key={m.label} className="group relative">
                <button className="nav-link">
                  {m.label}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 opacity-60">
                    <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                  <div className="grid w-[520px] grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-3 shadow-float">
                    {m.columns.map((col) => (
                      <div key={col.title} className="p-2">
                        <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted/80">{col.title}</p>
                        {col.items.map((item) => (
                          <Link key={item.label} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-cloud">
                            <span className="block text-[14px] font-medium text-ink">{item.label}</span>
                            {item.desc && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{item.desc}</span>}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Link href="/pricing" className="nav-link">Pricing</Link>
            <div className="group relative">
              <button className="nav-link">
                Resources
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 opacity-60">
                  <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                <div className="w-[280px] rounded-2xl border border-line bg-white p-2 shadow-float">
                  {[
                    ["API documentation", "/docs/api"],
                    ["Pricing & plans", "/pricing"],
                    ["Help center", "/docs/api"],
                    ["Customer stories", "/#customers"],
                  ].map(([label, href]) => (
                    <Link key={label} href={href} className="block rounded-lg px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-cloud">{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2.5 text-[14px] font-semibold text-ink hover:bg-cloud">
            Log In
          </Link>
          <Link href="/signup" className="btn btn-primary">Get started</Link>
        </div>

        <details className="relative lg:hidden">
          <summary className="btn btn-outline list-none">Menu</summary>
          <div className="absolute right-0 top-[calc(100%+8px)] w-[260px] rounded-2xl border border-line bg-white p-3 shadow-float">
            {["Product", "Solutions", "Teams"].map((label) => (
              <Link key={label} href="/signup" className="block rounded-lg px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-cloud">{label}</Link>
            ))}
            <Link href="/pricing" className="block rounded-lg px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-cloud">Pricing</Link>
            <Link href="/docs/api" className="block rounded-lg px-3 py-2.5 text-[14px] font-medium text-ink hover:bg-cloud">API docs</Link>
            <div className="mt-2 border-t border-line pt-2">
              <Link href="/login" className="block rounded-lg px-3 py-2.5 text-[14px] font-semibold text-ink hover:bg-cloud">Log In</Link>
              <Link href="/signup" className="btn btn-primary mt-1 w-full">Get started</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
