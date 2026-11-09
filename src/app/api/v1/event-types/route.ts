import { randomUUID } from "node:crypto";
import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { canAddEventType, canUsePayments, canUseRoundRobin, eventTypeLimit } from "@/lib/plans";
import { getTeamMembers, setEventHosts } from "@/lib/hosts";
import { serializeEventType } from "@/lib/booking-service";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "meeting";
}

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const rows = db.prepare("SELECT * FROM event_types WHERE user_id = ? ORDER BY created_at").all(user.id) as Record<string, unknown>[];
  return json({ data: rows.map(serializeEventType), meta: { count: rows.length } });
}

export async function POST(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const count = (db.prepare("SELECT COUNT(*) AS n FROM event_types WHERE user_id = ?").get(user.id) as { n: number }).n;
  if (!canAddEventType(user.plan, count)) {
    return json({ error: "plan_limit", message: "Free plan allows " + eventTypeLimit(user.plan) + " event types", upgrade: "/pricing" }, 402);
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) return json({ error: "title is required" }, 422);
  const duration = Math.max(5, Math.min(240, Number(body.duration ?? 30) || 30));
  const id = randomUUID();
  const assignment = canUseRoundRobin(user.plan) && body.assignment === "round_robin" ? "round_robin" : "solo";
  const canPay = canUsePayments(user.plan);
  const priceCents = canPay ? Math.max(0, Math.round(Number(body.price_cents ?? 0))) : 0;
  const currency = String(body.currency ?? "usd").toLowerCase().slice(0, 3);
  const requirePayment = canPay && Boolean(body.require_payment) && priceCents > 0 ? 1 : 0;
  let slug = slugify(String(body.slug ?? title));
  if (db.prepare("SELECT id FROM event_types WHERE user_id = ? AND slug = ?").get(user.id, slug)) slug += "-2";
  db.prepare(
    "INSERT INTO event_types (id, user_id, title, slug, description, duration, location, color, active, created_at, assignment, price_cents, currency, require_payment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)"
  ).run(id, user.id, title, slug, String(body.description ?? ""), duration, String(body.location ?? ""), String(body.color ?? "#7C3AED"), new Date().toISOString(), assignment, priceCents, currency, requirePayment);
  if (assignment === "round_robin") {
    const team = new Set(getTeamMembers(user.id).map((m) => m.id));
    const requested = Array.isArray(body.host_ids) ? (body.host_ids as unknown[]).map(String) : [];
    const hosts = requested.filter((h) => team.has(h));
    setEventHosts(id, hosts.length ? hosts : [user.id]);
  }
  const row = db.prepare("SELECT * FROM event_types WHERE id = ?").get(id) as Record<string, unknown>;
  return json({ data: serializeEventType(row) }, 201);
}