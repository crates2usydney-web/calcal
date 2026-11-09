import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { serializeEventType } from "@/lib/booking-service";
import { canUsePayments, canUseRoundRobin } from "@/lib/plans";
import { getTeamMembers, setEventHosts } from "@/lib/hosts";

type Ctx = { params: Promise<{ id: string }> };

async function owned(req: Request, id: string) {
  const user = await apiUser(req);
  if (!user) return { user: null, row: null };
  const row = db.prepare("SELECT * FROM event_types WHERE id = ? AND user_id = ?").get(id, user.id) as Record<string, unknown> | undefined;
  return { user, row: row ?? null };
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, row } = await owned(req, id);
  if (!user) return unauthorized();
  if (!row) return json({ error: "not_found" }, 404);
  return json({ data: serializeEventType(row) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, row } = await owned(req, id);
  if (!user) return unauthorized();
  if (!row) return json({ error: "not_found" }, 404);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const fields = ["title", "slug", "description", "duration", "location", "color", "active", "assignment"];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const f of fields) {
    if (f === "assignment") continue;
    if (body[f] !== undefined) {
      updates.push(f + " = ?");
      values.push(f === "duration" ? Math.max(5, Math.min(240, Number(body[f]) || 30)) : f === "active" ? (body[f] ? 1 : 0) : String(body[f]));
    }
  }
  if (body.assignment !== undefined) {
    const assignment = canUseRoundRobin(user.plan) && body.assignment === "round_robin" ? "round_robin" : "solo";
    updates.push("assignment = ?");
    values.push(assignment);
    if (assignment === "solo") setEventHosts(id, []);
  }
  if (canUsePayments(user.plan) && (body.price_cents !== undefined || body.currency !== undefined || body.require_payment !== undefined)) {
    const price = Math.max(0, Math.round(Number(body.price_cents ?? 0)));
    updates.push("price_cents = ?", "currency = ?", "require_payment = ?");
    values.push(price, String(body.currency ?? "usd").toLowerCase().slice(0, 3), Boolean(body.require_payment) && price > 0 ? 1 : 0);
  }
  if (Array.isArray(body.host_ids)) {
    const team = new Set(getTeamMembers(user.id).map((m) => m.id));
    const hosts = (body.host_ids as unknown[]).map(String).filter((h) => team.has(h));
    setEventHosts(id, hosts);
  }
  if (!updates.length) return json({ error: "no fields to update" }, 422);
  values.push(id, user.id);
  db.prepare("UPDATE event_types SET " + updates.join(", ") + " WHERE id = ? AND user_id = ?").run(...(values as never[]));
  const fresh = db.prepare("SELECT * FROM event_types WHERE id = ?").get(id) as Record<string, unknown>;
  return json({ data: serializeEventType(fresh) });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, row } = await owned(req, id);
  if (!user) return unauthorized();
  if (!row) return json({ error: "not_found" }, 404);
  db.prepare("DELETE FROM event_types WHERE id = ? AND user_id = ?").run(id, user.id);
  return json({ deleted: true });
}