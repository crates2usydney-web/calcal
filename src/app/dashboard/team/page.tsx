import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTeamMembers } from "@/lib/hosts";
import { canUseRoundRobin } from "@/lib/plans";
import { addTeamMemberAction, removeTeamMemberAction } from "@/lib/actions";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ added?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { added, error } = await searchParams;
  const members = getTeamMembers(user.id);
  const canRR = canUseRoundRobin(user.plan);

  return (
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-semibold tracking-tight">Team</h1>
      <p className="mt-1 text-[14px] text-muted">People who can host round-robin events with you.</p>
      {added && <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-800">Teammate added.</div>}
      {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">Enter a valid email.</div>}

      {!canRR && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[13.5px] font-semibold text-amber-900">Round robin is a Teams feature</p>
          <p className="mt-1 text-[12.5px] text-amber-800">Upgrade to Teams to route bookings across multiple hosts.</p>
          <Link href="/pricing" className="mt-2 inline-block rounded-lg bg-navy px-3 py-1.5 text-[12px] font-semibold text-white">See plans</Link>
        </div>
      )}

      <form action={addTeamMemberAction} className="mt-6 flex flex-wrap gap-2 rounded-xl border border-line bg-white p-4">
        <input name="email" type="email" placeholder="teammate@company.com" className="min-w-[240px] flex-1 rounded-lg border border-line px-3 py-2 text-[13px]" />
        <button className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white">Add teammate</button>
      </form>

      <div className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand">
                {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </span>
              <div>
                <p className="text-[14px] font-medium">
                  {m.name} {m.id === user.id && <span className="ml-1 rounded bg-mist px-1.5 py-0.5 text-[10.5px] font-semibold text-brand">You</span>}
                </p>
                <p className="text-[12px] text-muted">{m.email} · calcal.app/{m.username}</p>
              </div>
            </div>
            {m.id !== user.id && (
              <form action={removeTeamMemberAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-red-200 hover:text-red-600">Remove</button>
              </form>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-muted">
        New teammates get the demo password <code className="rounded bg-mist px-1.5 py-0.5">demo1234</code>.
      </p>
    </div>
  );
}
