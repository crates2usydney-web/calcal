import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { INTEGRATIONS } from "@/lib/integrations/catalog";

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const connections = db.prepare("SELECT app_id, status, connected_at FROM integration_connections WHERE user_id = ?").all(user.id) as {
    app_id: string; status: string; connected_at: string;
  }[];
  const byApp = new Map(connections.map((c) => [c.app_id, c]));
  return json({
    data: INTEGRATIONS.map((i) => ({
      ...i,
      connected: byApp.has(i.id),
      connection: byApp.get(i.id) ?? null,
    })),
    meta: { count: INTEGRATIONS.length, connected: connections.length },
  });
}
