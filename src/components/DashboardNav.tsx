"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Event types", icon: "▦" },
  { href: "/dashboard/availability", label: "Availability", icon: "◷" },
  { href: "/dashboard/bookings", label: "Bookings", icon: "▤" },
  { href: "/dashboard/team", label: "Team", icon: "👥" },
  { href: "/dashboard/integrations", label: "Integrations", icon: "◫" },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: "↗" },
  { href: "/dashboard/emails", label: "Emails", icon: "✉" },
  { href: "/dashboard/api-keys", label: "API keys", icon: "⌘" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition " +
              (active ? "bg-mist text-brand" : "text-navy/75 hover:bg-mist/60 hover:text-navy")
            }
          >
            <span className="text-[15px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}