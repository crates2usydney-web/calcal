import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getAvailability } from "@/lib/slots";

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  return json({ data: getAvailability(user.id), timezone: user.timezone });
}

export async function PUT(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { rules?: { weekday: number; start: string; end: string }[] };
  const toMin = (s: string) => {
    const [h, m] = String(s).split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  if (!Array.isArray(body.rules)) return json({ error: "rules[] required" }, 422);
  db.prepare("DELETE FROM availability WHERE user_id = ?").run(user.id);
  const ins = db.prepare("INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)");
  for (const r of body.rules) {
    if (r.weekday < 0 || r.weekday > 6) continue;
    const start = toMin(r.start);
    const end = toMin(r.end);
    if (end > start) ins.run(user.id, r.weekday, start, end);
  }
  return json({ data: getAvailability(user.id), timezone: user.timezone });
}
