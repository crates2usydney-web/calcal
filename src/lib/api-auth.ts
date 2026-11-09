import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { getCurrentUser } from "./auth";

export function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): string {
  return "cal_" + randomBytes(24).toString("hex");
}

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  timezone: string;
  plan: string;
};

export async function apiUser(req: Request): Promise<ApiUser | null> {
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) {
    const raw = header.slice(7).trim();
    const row = db
      .prepare(
        "SELECT k.id AS key_id, k.user_id, u.name, u.email, u.username, u.timezone, u.plan " +
        "FROM api_keys k JOIN users u ON u.id = k.user_id WHERE k.key_hash = ? AND k.revoked = 0"
      )
      .get(hashKey(raw)) as
      | { key_id: string; user_id: string; name: string; email: string; username: string; timezone: string; plan: string }
      | undefined;
    if (!row) return null;
    db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").run(new Date().toISOString(), row.key_id);
    return { id: row.user_id, name: row.name, email: row.email, username: row.username, timezone: row.timezone, plan: row.plan };
  }
  return getCurrentUser();
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function unauthorized() {
  return json({ error: "unauthorized", hint: "Pass Authorization: Bearer <api key>" }, 401);
}
