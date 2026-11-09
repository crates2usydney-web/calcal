import { randomUUID } from "node:crypto";
import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getIntegration } from "@/lib/integrations/catalog";

export async function POST(req: Request, ctx: { params: Promise<{ app: string }> }) {
  const { app } = await ctx.params;
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const integration = getIntegration(app);
  if (!integration) return json({ error: "unknown_integration" }, 404);
  db.prepare(
    "INSERT INTO integration_connections (id, user_id, app_id, status, mode, credentials, connected_at) VALUES (?, ?, ?, 'connected', 'demo', '{}', ?) " +
    "ON CONFLICT(user_id, app_id) DO UPDATE SET status = 'connected', connected_at = excluded.connected_at"
  ).run(randomUUID(), user.id, app, new Date().toISOString());
  return json({ connected: true, app: integration.id, mode: "demo" });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ app: string }> }) {
  const { app } = await ctx.params;
  const user = await apiUser(req);
  if (!user) return unauthorized();
  db.prepare("DELETE FROM integration_connections WHERE user_id = ? AND app_id = ?").run(user.id, app);
  return json({ disconnected: true, app });
}
