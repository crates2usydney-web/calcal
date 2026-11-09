import Link from "next/link";
import { Logo } from "@/components/Logo";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["Scheduling", "/signup"],
      ["Availability", "/signup"],
      ["Payments", "/signup"],
      ["Reminders", "/signup"],
      ["Integrations", "/signup"],
      ["Pricing", "/pricing"],
    ],
  },
  {
    title: "Solutions",
    links: [
      ["Sales", "/signup"],
      ["Customer success", "/signup"],
      ["Recruiting", "/signup"],
      ["Education", "/signup"],
      ["Healthcare", "/signup"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["API documentation", "/docs/api"],
      ["Help center", "/docs/api"],
      ["Developer tools", "/docs/api"],
      ["Pricing", "/pricing"],
      ["Status", "/api/health"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/"],
      ["Careers", "/"],
      ["Customers", "/#customers"],
      ["Contact", "/"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/"],
      ["Terms", "/"],
      ["Security", "/"],
      ["Acceptable use", "/"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div>
            <Logo size={26} />
            <p className="mt-4 max-w-[220px] text-[13px] leading-relaxed text-muted">
              Scheduling, reminders and payments for people whose work runs on meetings.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {["x", "in", "yt"].map((s) => (
                <span key={s} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-[11px] font-semibold uppercase text-muted">
                  {s}
                </span>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-semibold text-ink">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[13px] text-muted hover:text-brand">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 md:flex-row">
          <p className="text-[12.5px] text-muted">© {new Date().getFullYear()} calcal. All rights reserved.</p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted">
            <Link href="/pricing" className="hover:text-ink">Plans</Link>
            <Link href="/docs/api" className="hover:text-ink">API</Link>
            <Link href="/api/health" className="hover:text-ink">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
