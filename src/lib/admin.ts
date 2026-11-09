import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { getCurrentUser } from "./auth";

export type AdminUser = { id: string; name: string; email: string; username: string; plan: string; role: string; timezone: string };

export async function requireOwner(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const row = db.prepare("SELECT id, name, email, username, plan, role, timezone FROM users WHERE id = ?").get(user.id) as AdminUser | undefined;
  if (!row) redirect("/login");
  if ((row.role || "owner") !== "owner") redirect("/dashboard?denied=owner");
  return row;
}

export function logAudit(ownerId: string, actorId: string, action: string, entity = "", entityId = "", meta: Record<string, unknown> = {}) {
  db.prepare(
    "INSERT INTO audit_log (id, owner_id, actor_id, action, entity, entity_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(randomUUID(), ownerId, actorId, action, entity, entityId, JSON.stringify(meta), new Date().toISOString());
}

export const PLAN_LIMITS: Record<string, { name: string; seats: number; eventTypes: number; price: number; features: string[] }> = {
  free: { name: "Free", seats: 1, eventTypes: 3, price: 0, features: ["1 seat", "3 event types", "Booking page & polls"] },
  pro: { name: "Pro", seats: 1, eventTypes: Infinity, price: 800, features: ["1 seat", "Unlimited event types", "Reminders & payments"] },
  teams: { name: "Teams", seats: 10, eventTypes: Infinity, price: 1400, features: ["Up to 10 seats", "Round robin", "Routing forms"] },
  business: { name: "Business", seats: 50, eventTypes: Infinity, price: 2400, features: ["Up to 50 seats", "Audit log", "SSO & SAML"] },
};

export function planLimits(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  username: string;
  plan: string;
  role: string;
  status: string;
  invited_at: string | null;
  joined_at: string | null;
  added_at: string;
};

export function listMembers(ownerId: string): MemberRow[] {
  return db
    .prepare(
      "SELECT u.id, u.name, u.email, u.username, u.plan, tm.role, tm.status, tm.invited_at, tm.joined_at, tm.created_at AS added_at " +
        "FROM team_members tm JOIN users u ON u.id = tm.member_id WHERE tm.owner_id = ? ORDER BY tm.created_at ASC"
    )
    .all(ownerId) as MemberRow[];
}

export function seatUsage(ownerId: string) {
  const members = listMembers(ownerId);
  const active = members.filter((m) => m.status !== "deactivated").length;
  return { owner: 1, members: members.length, activeMembers: active, seatsUsed: 1 + active, total: 1 + members.length };
}