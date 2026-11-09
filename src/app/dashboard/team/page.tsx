import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTeamMembers } from "@/lib/hosts";
import { canUseRoundRobin } from "@/lib/plans";
import { addTeamMemberAction, removeTeamMemberAction } from "@/lib/actions";
import { PageHeader, Notice } from "@/components/PageHeader";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ added?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { added, error } = await searchParams;
  const members = getTeamMembers(user.id);
  const canRR = canUseRoundRobin(user.plan);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Team" subtitle="People who can host round-robin events with you. Bookings rotate to whoever is free and has the fewest meetings.">
        <Link href="/dashboard/event-types/new" className="btn btn-outline">New event type</Link>
      </PageHeader>

      {added && <Notice>Teammate added. They can now be selected as a host.</Notice>}
      {error && <Notice kind="error">Enter a valid email address.</Notice>}

      {!canRR && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[13.5px] font-semibold text-amber-900">Round robin is a Teams feature</p>
          <p className="mt-1 text-[12.5px] text-amber-800">Upgrade to route bookings across multiple hosts.</p>
          <Link href="/pricing" className="btn btn-navy mt-3">See plans</Link>
        </div>
      )}

      <form action={addTeamMemberAction} className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="text-[14px] font-semibold">Invite a teammate</h2>
        <p className="mt-0.5 text-[12.5px] text-muted">They get their own booking page and can be a round-robin host.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input name="email" type="email" required placeholder="teammate@company.com" className="input min-w-[240px] flex-1" />
          <button className="btn btn-primary">Add teammate</button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
        <div className="hidden grid-cols-[1fr_120px] gap-3 border-b border-line bg-cloud/60 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted sm:grid">
          <span>Member</span><span className="text-right">Action</span>
        </div>
        <div className="divide-y divide-line">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
                  {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="text-[14px] font-medium">
                    {m.name}
                    {m.id === user.id && <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-brand">You</span>}
                  </p>
                  <p className="text-[12px] text-muted">{m.email} · calcal.app/{m.username}</p>
                </div>
              </div>
              {m.id !== user.id ? (
                <form action={removeTeamMemberAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="rounded-full border border-line px-3.5 py-1.5 text-[12px] font-medium text-muted hover:border-red-200 hover:text-red-600">Remove</button>
                </form>
              ) : (
                <span className="text-[12px] text-muted">Owner</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[12px] text-muted">New teammates get the demo password <code className="rounded bg-cloud px-1.5 py-0.5">demo1234</code>.</p>
    </div>
  );
}
