import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await apiUser(req);
  if (!user) return unauthorized();
  db.prepare("DELETE FROM webhook_deliveries WHERE endpoint_id = ? AND user_id = ?").run(id, user.id);
  db.prepare("DELETE FROM webhook_endpoints WHERE id = ? AND user_id = ?").run(id, user.id);
  return json({ deleted: true });
}
