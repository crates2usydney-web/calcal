import { db } from "@/lib/db";
import { json } from "@/lib/api-auth";

export async function GET(_: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  const user = db
    .prepare("SELECT id, name, username, timezone, welcome_message FROM users WHERE username = ?")
    .get(username.toLowerCase()) as
    | { id: string; name: string; username: string; timezone: string; welcome_message: string }
    | undefined;
  if (!user) return json({ error: "not_found" }, 404);
  const events = db
    .prepare("SELECT id, title, slug, description, duration, location, color, assignment FROM event_types WHERE user_id = ? AND active = 1 ORDER BY created_at")
    .all(user.id);
  return json({ data: { host: user, event_types: events } });
}