import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { DashboardNav } from "@/components/DashboardNav";
import { CopyButton } from "@/components/CopyButton";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <details className="relative md:hidden">
              <summary className="list-none rounded-full border border-line px-3 py-2 text-[12px] font-medium text-ink">Menu</summary>
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-xl border border-line bg-white p-2 shadow-float">
                {[
                  ["Event types", "/dashboard"],
                  ["Availability", "/dashboard/availability"],
                  ["Bookings", "/dashboard/bookings"],
                  ["Meeting polls", "/dashboard/polls"],
                  ["Routing forms", "/dashboard/routing"],
                  ["Team", "/dashboard/team"],
                  ["Emails", "/dashboard/emails"],
                  ["Integrations", "/dashboard/integrations"],
                  ["Webhooks", "/dashboard/webhooks"],
                  ["API keys", "/dashboard/api-keys"],
                  ["Settings", "/dashboard/settings"],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-[13px] font-medium text-ink hover:bg-cloud">{label}</Link>
                ))}
              </div>
            </details>
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-[10.5px] font-semibold text-white">{initials}</span>
              <span className="text-[13.5px] font-semibold text-ink">{user.name}</span>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand">{user.plan}</span>
              {user.plan === "free" && (
                <Link href="/pricing" className="text-[12px] font-semibold text-brand hover:underline">Upgrade</Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={"/" + user.username} className="hidden rounded-full border border-line px-3.5 py-2 text-[12.5px] font-medium text-ink hover:border-ink/30 lg:inline">
              View booking page
            </Link>
            <CopyButton path={"/" + user.username} label="Copy link" />
            <form action={logoutAction}>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink" title="Log out" aria-label="Log out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </form>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">{initials}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[248px] shrink-0 overflow-y-auto border-r border-line bg-white px-4 py-5 md:block">
          <Link href="/dashboard/event-types/new" className="mb-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-[13.5px] font-semibold text-white hover:bg-brand-dark">
            <span className="text-[16px] leading-none">+</span> Create
          </Link>
          <DashboardNav />
          <div className="mt-6 rounded-xl border border-line bg-cloud p-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">Your page</p>
            <p className="mt-1 truncate text-[12.5px] font-medium text-brand">calcal.app/{user.username}</p>
            <div className="mt-2 flex items-center justify-between">
              <Link href={"/" + user.username} className="text-[12px] font-medium text-ink underline">Open</Link>
              <CopyButton path={"/" + user.username} label="Copy" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}