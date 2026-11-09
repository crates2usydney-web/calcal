import { randomUUID } from "node:crypto";
import { db } from "./db";
import { getEventHosts, pickHostForSlot, unionSlotsForDay } from "./hosts";
import { canUsePayments } from "./plans";

export type CreateBookingInput = {
  eventTypeId: string;
  startISO: string;
  name: string;
  email: string;
  notes?: string;
};

export function createBookingRecord(userId: string, input: CreateBookingInput) {
  if (!input.eventTypeId || !input.startISO || !input.name || !input.email) {
    return { ok: false as const, error: "eventTypeId, startISO, name and email are required" };
  }
  const et = db
    .prepare("SELECT * FROM event_types WHERE id = ? AND user_id = ? AND active = 1")
    .get(input.eventTypeId, userId) as
    | { id: string; user_id: string; duration: number; assignment: string; price_cents: number; require_payment: number }
    | undefined;
  if (!et) return { ok: false as const, error: "event type not found" };

  const user = db.prepare("SELECT timezone FROM users WHERE id = ?").get(userId) as { timezone: string };
  const dayISO = new Date(input.startISO).toLocaleDateString("en-CA", { timeZone: user.timezone });
  const hosts = getEventHosts(et.id, userId, et.assignment);
  const slot = unionSlotsForDay({ hosts, dayISO, duration: et.duration, displayTz: user.timezone }).find(
    (s) => s.startISO === input.startISO
  );
  if (!slot) return { ok: false as const, error: "slot is not available" };
  const hostId = pickHostForSlot(slot.hostIds, input.startISO, et.duration);
  if (!hostId) return { ok: false as const, error: "slot is not available" };

  const id = randomUUID();
  const endISO = new Date(new Date(input.startISO).getTime() + et.duration * 60_000).toISOString();
  db.prepare(
    "INSERT INTO bookings (id, event_type_id, host_id, invitee_name, invitee_email, notes, start_utc, end_utc, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)"
  ).run(id, et.id, hostId, input.name, input.email, input.notes ?? "", input.startISO, endISO, new Date().toISOString());
  const hostPlan = (db.prepare("SELECT plan FROM users WHERE id = ?").get(userId) as { plan: string }).plan;
  const requirePayment = Number(et.require_payment) === 1 && Number(et.price_cents) > 0 && canUsePayments(hostPlan);
  if (requirePayment) {
    db.prepare("UPDATE bookings SET payment_status = 'unpaid', amount_cents = ? WHERE id = ?").run(Number(et.price_cents), id);
  }
  return { ok: true as const, id, paymentRequired: requirePayment };
}

export function serializeEventType(e: Record<string, unknown>) {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description,
    duration: e.duration,
    location: e.location,
    color: e.color,
    active: Boolean(e.active),
    assignment: e.assignment ?? "solo",
    price_cents: e.price_cents ?? 0,
    currency: e.currency ?? "usd",
    require_payment: Boolean(e.require_payment),
    created_at: e.created_at,
  };
}

export function serializeBooking(b: Record<string, unknown>) {
  return {
    id: b.id,
    event_type_id: b.event_type_id,
    host_id: b.host_id,
    invitee: { name: b.invitee_name, email: b.invitee_email },
    notes: b.notes,
    start: b.start_utc,
    end: b.end_utc,
    status: b.status,
    payment_status: b.payment_status ?? "not_required",
    amount_cents: b.amount_cents ?? 0,
    created_at: b.created_at,
  };
}