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

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <Logo size={26} />
            <span className="hidden rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand md:inline">
              {user.plan} plan
            </span>
            {user.plan === "free" && (
              <Link href="/pricing" className="hidden text-[12.5px] font-semibold text-brand hover:underline md:inline">
                Upgrade
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <CopyButton path={"/" + user.username} label="Copy my link" />
            <form action={logoutAction}>
              <button className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-navy hover:border-navy/30">
                Log out
              </button>
            </form>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-[13px] font-semibold text-brand">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <Link
            href="/dashboard/event-types/new"
            className="mb-4 block rounded-lg bg-brand px-4 py-2.5 text-center text-[13.5px] font-semibold text-white hover:bg-brand-dark"
          >
            + Create
          </Link>
          <DashboardNav />
          <div className="mt-8 rounded-xl border border-line bg-white p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Your page</p>
            <p className="mt-1 truncate text-[13px] text-brand">calcal.app/{user.username}</p>
            <Link href={"/" + user.username} className="mt-2 inline-block text-[12.5px] font-medium text-navy underline">
              View booking page
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}