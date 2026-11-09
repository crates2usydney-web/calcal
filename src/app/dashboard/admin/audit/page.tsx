import { db } from "@/lib/db";
import { requireOwner } from "@/lib/admin";

const LABELS: Record<string, string> = {
  "member.invited": "Invited member",
  "member.role_changed": "Changed member role",
  "member.deactivated": "Deactivated member",
  "member.reactivated": "Reactivated member",
  "member.invite_resent": "Resent invite",
  "member.removed": "Removed member",
  "plan.changed": "Changed plan",
  "invoice.created": "Created invoice",
  "invoice.paid": "Marked invoice paid",
};

export default async function AdminAudit() {
  const owner = await requireOwner();
  const rows = db.prepare(
    "SELECT a.id, a.action, a.entity, a.entity_id, a.meta, a.created_at, a.actor_id, u.name AS actor_name, u.email AS actor_email " +
      "FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id WHERE a.owner_id = ? ORDER BY a.created_at DESC LIMIT 100"
  ).all(owner.id) as { id: string; action: string; entity: string; entity_id: string; meta: string; created_at: string; actor_id: string; actor_name: string | null; actor_email: string | null }[];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[13.5px] font-semibold">Audit log</h2>
          <span className="text-[12px] text-muted">{rows.length} events</span>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead className="bg-cloud/60 text-[11px] uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-2 font-semibold">When</th><th className="px-4 py-2 font-semibold">Actor</th><th className="px-4 py-2 font-semibold">Action</th><th className="px-4 py-2 font-semibold">Target</th><th className="px-4 py-2 font-semibold">Details</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-2.5">{r.actor_name || "Unknown"}<span className="block text-[11px] text-muted">{r.actor_email || r.actor_id}</span></td>
                <td className="px-4 py-2.5 font-medium">{LABELS[r.action] || r.action}</td>
                <td className="px-4 py-2.5 text-muted">{r.entity}{r.entity_id ? " · " + r.entity_id.slice(0, 8) : ""}</td>
                <td className="px-4 py-2.5 text-muted"><code className="text-[11.5px]">{r.meta}</code></td>
              </tr>
            ))}
            {rows.length === 0 && <tr className="border-t border-line"><td colSpan={5} className="px-4 py-8 text-center text-muted">No audit events yet. Invite a member or change the plan to start the trail.</td></tr>}
          </tbody>
        </table>
      </section>
      <p className="text-[11.5px] text-muted">Every owner action in Members, Plan and invoices writes an immutable entry here. Entries are scoped to this workspace.</p>
    </div>
  );
}
