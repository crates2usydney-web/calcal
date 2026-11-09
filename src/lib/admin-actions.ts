"use server";

import { randomUUID, scryptSync, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { PLAN_ORDER } from "./plans";
import { logAudit, planLimits, requireOwner } from "./admin";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}

function uniqueUsername(base: string) {
  const clean = base.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20) || "member";
  let candidate = clean;
  let i = 1;
  while (db.prepare("SELECT 1 FROM users WHERE username = ?").get(candidate)) candidate = clean + (++i);
  return candidate;
}

function assertMember(ownerId: string, memberId: string) {
  const row = db.prepare("SELECT member_id FROM team_members WHERE owner_id = ? AND member_id = ?").get(ownerId, memberId);
  if (!row) throw new Error("member not found");
}

export async function inviteAdminMemberAction(fd: FormData) {
  const owner = await requireOwner();
  const email = str(fd, "email").toLowerCase();
  const role = ["admin", "member"].includes(str(fd, "role")) ? str(fd, "role") : "member";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/dashboard/admin/members?error=email");

  const seats = planLimits(owner.plan).seats;
  const used = 1 + ((db.prepare("SELECT COUNT(*) AS n FROM team_members WHERE owner_id = ? AND status != 'deactivated'").get(owner.id) as { n: number }).n);
  if (used >= seats) redirect("/dashboard/admin/members?error=seats");

  let user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  if (!user) {
    const id = randomUUID();
    const username = uniqueUsername(email.split("@")[0]);
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, username, timezone, welcome_message, created_at, plan, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'member')"
    ).run(id, email.split("@")[0], email, hashPassword("demo1234"), username, owner.timezone ?? "America/New_York", "Hi! Pick a time that works for you.", new Date().toISOString(), owner.plan);
    const ins = db.prepare("INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)");
    for (let d = 1; d <= 5; d++) ins.run(id, d, 9 * 60, 17 * 60);
    user = { id };
  }

  db.prepare(
    "INSERT INTO team_members (owner_id, member_id, created_at, role, status, invited_at) VALUES (?, ?, ?, ?, 'invited', ?) " +
      "ON CONFLICT(owner_id, member_id) DO UPDATE SET role = excluded.role, status = 'invited', invited_at = excluded.invited_at"
  ).run(owner.id, user.id, new Date().toISOString(), role, new Date().toISOString());

  logAudit(owner.id, owner.id, "member.invited", "user", user.id, { email, role });
  revalidatePath("/dashboard/admin/members");
  redirect("/dashboard/admin/members?invited=" + encodeURIComponent(email));
}

export async function updateMemberRoleAction(fd: FormData) {
  const owner = await requireOwner();
  const memberId = str(fd, "member_id");
  const role = ["admin", "member"].includes(str(fd, "role")) ? str(fd, "role") : "member";
  assertMember(owner.id, memberId);
  db.prepare("UPDATE team_members SET role = ? WHERE owner_id = ? AND member_id = ?").run(role, owner.id, memberId);
  logAudit(owner.id, owner.id, "member.role_changed", "user", memberId, { role });
  revalidatePath("/dashboard/admin/members");
  redirect("/dashboard/admin/members?updated=role");
}

export async function setMemberStatusAction(fd: FormData) {
  const owner = await requireOwner();
  const memberId = str(fd, "member_id");
  const status = str(fd, "status") === "active" ? "active" : "deactivated";
  assertMember(owner.id, memberId);
  db.prepare("UPDATE team_members SET status = ?, joined_at = COALESCE(joined_at, ?) WHERE owner_id = ? AND member_id = ?").run(
    status,
    status === "active" ? new Date().toISOString() : null,
    owner.id,
    memberId
  );
  logAudit(owner.id, owner.id, status === "active" ? "member.reactivated" : "member.deactivated", "user", memberId);
  revalidatePath("/dashboard/admin/members");
  redirect("/dashboard/admin/members?updated=" + status);
}

export async function resendInviteAction(fd: FormData) {
  const owner = await requireOwner();
  const memberId = str(fd, "member_id");
  assertMember(owner.id, memberId);
  db.prepare("UPDATE team_members SET invited_at = ? WHERE owner_id = ? AND member_id = ?").run(new Date().toISOString(), owner.id, memberId);
  logAudit(owner.id, owner.id, "member.invite_resent", "user", memberId);
  revalidatePath("/dashboard/admin/members");
  redirect("/dashboard/admin/members?resent=1");
}

export async function removeMemberAction(fd: FormData) {
  const owner = await requireOwner();
  const memberId = str(fd, "member_id");
  assertMember(owner.id, memberId);
  db.prepare("DELETE FROM team_members WHERE owner_id = ? AND member_id = ?").run(owner.id, memberId);
  logAudit(owner.id, owner.id, "member.removed", "user", memberId);
  revalidatePath("/dashboard/admin/members");
  redirect("/dashboard/admin/members?updated=removed");
}

export async function adminChangePlanAction(fd: FormData) {
  const owner = await requireOwner();
  const plan = str(fd, "plan");
  if (!PLAN_ORDER.includes(plan)) redirect("/dashboard/admin/plan?error=plan");
  db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, owner.id);
  logAudit(owner.id, owner.id, "plan.changed", "user", owner.id, { plan });
  revalidatePath("/dashboard/admin/plan");
  redirect("/dashboard/admin/plan?updated=" + plan);
}

export async function createInvoiceAction(fd: FormData) {
  const owner = await requireOwner();
  const plan = str(fd, "plan") || owner.plan;
  const seats = Math.max(1, Number(str(fd, "seats") || "1"));
  const months = Math.max(1, Math.min(12, Number(str(fd, "months") || "1")));
  const price = planLimits(plan).price;
  const amount = price * seats * months;
  const now = new Date();
  const end = new Date(now.getTime() + months * 30 * 86400_000);
  const count = (db.prepare("SELECT COUNT(*) AS n FROM invoices WHERE owner_id = ?").get(owner.id) as { n: number }).n;
  const number = "CAL-" + now.getFullYear() + "-" + String(count + 1).padStart(4, "0");
  const id = randomUUID();
  db.prepare(
    "INSERT INTO invoices (id, owner_id, number, plan, seats, amount_cents, currency, status, period_start, period_end, created_at) VALUES (?, ?, ?, ?, ?, ?, 'USD', 'open', ?, ?, ?)"
  ).run(id, owner.id, number, plan, seats, amount, now.toISOString(), end.toISOString(), now.toISOString());
  logAudit(owner.id, owner.id, "invoice.created", "invoice", id, { number, amount, plan, seats, months });
  revalidatePath("/dashboard/admin/plan");
  redirect("/dashboard/admin/plan?invoice=" + number);
}

export async function markInvoicePaidAction(fd: FormData) {
  const owner = await requireOwner();
  const id = str(fd, "invoice_id");
  const row = db.prepare("SELECT id FROM invoices WHERE id = ? AND owner_id = ?").get(id, owner.id);
  if (!row) redirect("/dashboard/admin/plan?error=invoice");
  db.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?").run(id);
  logAudit(owner.id, owner.id, "invoice.paid", "invoice", id);
  revalidatePath("/dashboard/admin/plan");
  redirect("/dashboard/admin/plan?updated=paid");
}
