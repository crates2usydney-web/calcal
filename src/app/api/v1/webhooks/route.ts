import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { WEBHOOK_EVENTS, createEndpoint } from "@/lib/integrations/engine";

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const rows = db.prepare("SELECT id, url, events, active, created_at FROM webhook_endpoints WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
  return json({ data: rows, events: WEBHOOK_EVENTS });
}

export async function POST(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { url?: string; events?: string[] };
  if (!body.url || !/^https?:\/\//i.test(body.url)) return json({ error: "valid url required" }, 422);
  const events = Array.isArray(body.events) ? body.events.filter((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e)) : [];
  const id = createEndpoint(user.id, body.url, events);
  const row = db.prepare("SELECT id, url, secret, events, active, created_at FROM webhook_endpoints WHERE id = ?").get(id);
  return json({ data: row }, 201);
}
