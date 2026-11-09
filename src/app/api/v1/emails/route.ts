import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const rows = db
    .prepare("SELECT id, to_email, subject, kind, status, send_at, sent_at, created_at FROM emails WHERE user_id = ? ORDER BY created_at DESC LIMIT 200")
    .all(user.id);
  return json({ data: rows });
}
