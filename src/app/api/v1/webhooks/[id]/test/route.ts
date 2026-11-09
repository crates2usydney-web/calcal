import { randomUUID } from "node:crypto";
import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { deliverPending } from "@/lib/integrations/engine";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const ep = db.prepare("SELECT id FROM webhook_endpoints WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!ep) return json({ error: "not_found" }, 404);
  db.prepare(
    "INSERT INTO webhook_deliveries (id, endpoint_id, user_id, event, payload, status, attempts, next_attempt_at, created_at) VALUES (?, ?, ?, 'test', ?, 'pending', 0, ?, ?)"
  ).run(randomUUID(), id, user.id, JSON.stringify({ event: "test", created_at: new Date().toISOString(), data: { message: "calcal test delivery" } }), new Date().toISOString(), new Date().toISOString());
  const result = await deliverPending(user.id, 5);
  return json({ ok: true, ...result });
}
