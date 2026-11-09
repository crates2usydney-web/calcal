import Link from "next/link";
import { EventTypeForm } from "@/components/EventTypeForm";
import { getCurrentUser } from "@/lib/auth";
import { getTeamMembers } from "@/lib/hosts";

export default async function NewEventTypePage({ searchParams }: { searchParams: Promise<{ limit?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { limit } = await searchParams;
  const team = getTeamMembers(user.id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-semibold tracking-tight">New event type</h1>
      <p className="mt-1 mb-6 text-[14px] text-muted">Create a meeting people can book from your link.</p>
      {limit && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[14px] font-semibold text-amber-900">Free plan includes 3 event types</p>
          <p className="mt-1 text-[13px] text-amber-800">Upgrade to Pro for unlimited event types, reminders, payments and integrations.</p>
          <Link href="/pricing" className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white">
            See plans
          </Link>
        </div>
      )}
      <EventTypeForm team={team} plan={user.plan} />
    </div>
  );
}
