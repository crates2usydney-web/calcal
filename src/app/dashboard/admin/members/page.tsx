import { db } from "@/lib/db";
import { listMembers, planLimits, requireOwner, seatUsage } from "@/lib/admin";
import { inviteAdminMemberAction, removeMemberAction, resendInviteAction, setMemberStatusAction, updateMemberRoleAction } from "@/lib/admin-actions";

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ invited?: string; resent?: string; updated?: string; error?: string }> }) {
  const owner = await requireOwner();
  const { invited, resent, updated, error } = await searchParams;
  const members = listMembers(owner.id);
  const seats = seatUsage(owner.id);
  const limits = planLimits(owner.plan);
  const invitees = db.prepare("SELECT COUNT(*) AS n FROM team_members WHERE owner_id = ? AND status = 'invited'").get(owner.id) as { n: number };

  const msg =
    error === "seats" ? { tone: "red", text: "Seat limit reached for the " + limits.name + " plan. Upgrade or deactivate a member first." } :
    error === "email" ? { tone: "red", text: "Enter a valid email address." } :
    invited ? { tone: "green", text: "Invite sent to " + invited + ". They can sign in with demo1234 (demo workspace)." } :
    resent ? { tone: "green", text: "Invite re-sent." } :
    updated ? { tone: "green", text: "Member " + updated + "." } : null;

  return (
    <div className="space-y-5">
      {msg && <div className={"rounded-lg px-3 py-2 text-[13px] " + (msg.tone === "red" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800")}>{msg.text}</div>}

      <div className="grid gap-3 sm:grid-cols-3">
        {[["Seats used", seats.seatsUsed + " / " + (limits.seats === Infinity ? "∞" : limits.seats)], ["Pending invites", String(invitees.n)], ["Plan", limits.name]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">{l}</p>
            <p className="mt-1.5 text-[20px] font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">Invite a teammate</h2>
        <p className="mt-1 text-[12px] text-muted">They get their own booking page and can host round-robin events. Roles apply inside the workspace.</p>
        <form action={inviteAdminMemberAction} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[11.5px] font-medium text-muted">Email</label>
            <input name="email" type="email" required placeholder="teammate@company.com" className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-muted">Role</label>
            <select name="role" className="input">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary">Send invite</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-cloud/60 text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Member</th>
              <th className="px-4 py-2.5 font-semibold">Role</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Joined</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <td className="px-4 py-3">
                <p className="font-medium">{owner.name} <span className="text-muted">(you)</span></p>
                <p className="text-[12px] text-muted">{owner.email}</p>
              </td>
              <td className="px-4 py-3"><span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold uppercase text-brand">Owner</span></td>
              <td className="px-4 py-3"><span className="text-green-700">Active</span></td>
              <td className="px-4 py-3 text-muted">—</td>
              <td className="px-4 py-3 text-right text-muted">Full control</td>
            </tr>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-[12px] text-muted">{m.email} · calcal.app/{m.username}</p>
                </td>
                <td className="px-4 py-3">
                  <form action={updateMemberRoleAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="member_id" value={m.id} />
                    <select name="role" defaultValue={m.role} className="input py-1 text-[12px]">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="rounded-md border border-line px-2 py-1 text-[11.5px] font-medium">Save</button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <span className={"rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase " + (m.status === "active" ? "bg-green-50 text-green-700" : m.status === "invited" ? "bg-amber-50 text-amber-700" : "bg-cloud text-muted")}>{m.status}</span>
                </td>
                <td className="px-4 py-3 text-muted">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : m.status === "invited" ? "Invite pending" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <form action={resendInviteAction}><input type="hidden" name="member_id" value={m.id} /><button className="rounded-md border border-line px-2 py-1 text-[11.5px] font-medium">Resend</button></form>
                    <form action={setMemberStatusAction}>
                      <input type="hidden" name="member_id" value={m.id} />
                      <input type="hidden" name="status" value={m.status === "deactivated" ? "active" : "deactivated"} />
                      <button className="rounded-md border border-line px-2 py-1 text-[11.5px] font-medium">{m.status === "deactivated" ? "Reactivate" : "Deactivate"}</button>
                    </form>
                    <form action={removeMemberAction}><input type="hidden" name="member_id" value={m.id} /><button className="rounded-md border border-line px-2 py-1 text-[11.5px] font-medium text-muted hover:text-red-600">Remove</button></form>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr className="border-t border-line"><td colSpan={5} className="px-4 py-8 text-center text-muted">No teammates yet. Invite someone above to start round-robin scheduling.</td></tr>
            )}
          </tbody>
        </table>
      </section>
      <p className="text-[11.5px] text-muted">Role enforcement: only the owner can open this console; Admin and Member roles are stored per workspace for future permission checks.</p>
    </div>
  );
}
