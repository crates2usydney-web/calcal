import Link from "next/link";
import { requireOwner } from "@/lib/admin";
import { PageHeader } from "@/components/PageHeader";

const tabs = [
  ["Overview", "/dashboard/admin"],
  ["Members & roles", "/dashboard/admin/members"],
  ["Plan & seats", "/dashboard/admin/plan"],
  ["Usage", "/dashboard/admin/usage"],
  ["Health", "/dashboard/admin/health"],
  ["Audit log", "/dashboard/admin/audit"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Admin" subtitle={"Owner console for " + owner.name + "'s workspace. You have full control."} />
        <span className="rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">Owner only</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-1.5 border-b border-line pb-2">
        {tabs.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink/75 transition hover:bg-cloud hover:text-ink">
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}