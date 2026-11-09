"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: keyof typeof icons };

const icons = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/></svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7.5V12l3 1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="m9 14.5 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.7"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.6c2 .5 3.2 2 3.6 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  plug: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3v5M15 3v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M6.5 8h11v3a5.5 5.5 0 0 1-11 0V8Z" stroke="currentColor" strokeWidth="1.7"/><path d="M12 16.5V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  webhook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9.5 7.5a3.5 3.5 0 1 1 5 3.2l-2 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M8 12.5 5.5 17a3.5 3.5 0 0 0 4.3 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M14.5 12.5 17 17a3.5 3.5 0 0 1-4.3 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  key: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M12 12h8.5M17 12v3M20 12v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" stroke="currentColor" strokeWidth="1.4"/></svg>
  ),
} as const;

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Scheduling",
    items: [
      { href: "/dashboard", label: "Event types", icon: "grid" },
      { href: "/dashboard/availability", label: "Availability", icon: "clock" },
      { href: "/dashboard/bookings", label: "Bookings", icon: "calendar" },
      { href: "/dashboard/team", label: "Team", icon: "users" },
    ],
  },
  {
    title: "Automation",
    items: [
      { href: "/dashboard/emails", label: "Emails & reminders", icon: "mail" },
      { href: "/dashboard/integrations", label: "Integrations", icon: "plug" },
      { href: "/dashboard/webhooks", label: "Webhooks", icon: "webhook" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/dashboard/api-keys", label: "API keys", icon: "key" },
      { href: "/dashboard/settings", label: "Settings", icon: "settings" },
    ],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted/70">{g.title}</p>
          <div className="space-y-0.5">
            {g.items.map((item) => {
              const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition " +
                    (active ? "bg-brand-soft text-brand" : "text-ink/75 hover:bg-cloud hover:text-ink")
                  }
                >
                  <span className={active ? "text-brand" : "text-muted"}>{icons[item.icon]}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
