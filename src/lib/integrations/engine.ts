import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { db } from "../db";

export const WEBHOOK_EVENTS = ["booking.created", "booking.canceled", "booking.rescheduled", "invitee.created"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function generateSecret(): string {
  return "whsec_" + randomBytes(24).toString("hex");
}

export function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function createEndpoint(userId: string, url: string, events: string[]): string {
  const id = randomUUID();
  db.prepare("INSERT INTO webhook_endpoints (id, user_id, url, secret, events, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)").run(
    id,
    userId,
    url,
    generateSecret(),
    JSON.stringify(events.length ? events : ["booking.created", "booking.canceled"]),
    new Date().toISOString()
  );
  return id;
}

type EndpointRow = { id: string; url: string; secret: string; events: string };

export async function emitEvent(userId: string, event: WebhookEvent, data: unknown): Promise<number> {
  const endpoints = db
    .prepare("SELECT id, url, secret, events FROM webhook_endpoints WHERE user_id = ? AND active = 1")
    .all(userId) as EndpointRow[];
  let queued = 0;
  for (const ep of endpoints) {
    let events: string[] = [];
    try { events = JSON.parse(ep.events); } catch { events = []; }
    if (!events.includes(event) && !events.includes("*")) continue;
    db.prepare(
      "INSERT INTO webhook_deliveries (id, endpoint_id, user_id, event, payload, status, attempts, next_attempt_at, created_at) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)"
    ).run(randomUUID(), ep.id, userId, event, JSON.stringify({ event, created_at: new Date().toISOString(), data }), new Date().toISOString(), new Date().toISOString());
    queued++;
  }
  if (queued) await deliverPending(userId);
  return queued;
}

export async function deliverPending(userId: string, limit = 25): Promise<{ delivered: number; failed: number }> {
  const now = new Date().toISOString();
  const rows = db
    .prepare(
      "SELECT d.*, e.url AS endpoint_url, e.secret AS endpoint_secret FROM webhook_deliveries d JOIN webhook_endpoints e ON e.id = d.endpoint_id " +
      "WHERE d.user_id = ? AND d.status IN ('pending','failed') AND d.attempts < 5 AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= ?) ORDER BY d.created_at LIMIT ?"
    )
    .all(userId, now, limit) as {
      id: string; endpoint_url: string; endpoint_secret: string; event: string; payload: string; attempts: number;
    }[];
  let delivered = 0;
  let failed = 0;
  for (const row of rows) {
    const body = row.payload;
    const signature = signPayload(row.endpoint_secret, body);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(row.endpoint_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "calcal-webhooks/1.0",
          "X-Calcal-Event": row.event,
          "X-Calcal-Signature": "sha256=" + signature,
          "X-Calcal-Delivery": row.id,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        db.prepare("UPDATE webhook_deliveries SET status='delivered', attempts=attempts+1, response_code=?, last_error=NULL WHERE id=?").run(res.status, row.id);
        delivered++;
      } else {
        const attempts = row.attempts + 1;
        db.prepare("UPDATE webhook_deliveries SET status='failed', attempts=?, response_code=?, last_error=?, next_attempt_at=? WHERE id=?").run(
          attempts, res.status, "HTTP " + res.status, new Date(Date.now() + Math.min(60_000 * attempts, 3_600_000)).toISOString(), row.id
        );
        failed++;
      }
    } catch (err) {
      const attempts = row.attempts + 1;
      db.prepare("UPDATE webhook_deliveries SET status='failed', attempts=?, last_error=?, next_attempt_at=? WHERE id=?").run(
        attempts, String(err), new Date(Date.now() + Math.min(60_000 * attempts, 3_600_000)).toISOString(), row.id
      );
      failed++;
    }
  }
  return { delivered, failed };
}

export function listDeliveries(userId: string, limit = 50) {
  return db
    .prepare("SELECT d.id, d.event, d.status, d.attempts, d.response_code, d.last_error, d.created_at, e.url FROM webhook_deliveries d JOIN webhook_endpoints e ON e.id = d.endpoint_id WHERE d.user_id = ? ORDER BY d.created_at DESC LIMIT ?")
    .all(userId, limit);
}
