"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { db, verifyPassword } from "./db";
import { clearSessionCookie, createSession, getCurrentUser, requireUser, setSessionCookie } from "./auth";
import { getEventHosts, getTeamMembers, pickHostForSlot, setEventHosts, unionSlotsForDay } from "./hosts";
import { canAddEventType, canUsePayments, canUseRoundRobin, PLAN_ORDER } from "./plans";
import { deliverDueEmails, queueTestEmail, sendBookingNotifications, sendCancellationNotifications } from "./email";
import { generateApiKey, hashKey } from "./api-auth";
import { hashPasswordSync } from "./passwords";
import { getIntegration } from "./integrations/catalog";
import { getConnection, seedDemoBusy, syncBusy } from "./google";
import { createCheckoutSession } from "./stripe";
import { createEndpoint, deliverPending, emitEvent } from "./integrations/engine";
import { bookingEventPayload } from "./integrations/events";

function str(fd: FormData, key: string, fallback = ""): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : fallback;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "meeting";
}

export async function signupAction(fd: FormData) {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  let username = slugify(str(fd, "username") || name);
  if (!name || !email || password.length < 6) redirect("/signup?error=missing");

  const exists = db.prepare("SELECT id FROM users WHERE lower(email) = ?").get(email);
  if (exists) redirect("/signup?error=exists");

  const taken = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (taken) username = username + "-" + Math.floor(Math.random() * 900 + 100);

  const { hashPasswordSync } = await import("./passwords");
  const userId = randomUUID();
  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, username, timezone, welcome_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(userId, name, email, hashPasswordSync(password), username, "America/New_York", "Welcome to my scheduling page. Pick a time that works for you.", new Date().toISOString());

  db.prepare(
    "INSERT INTO event_types (id, user_id, title, slug, description, duration, location, color, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(randomUUID(), userId, "30 Minute Meeting", "30min", "A focused 30 minute conversation.", 30, "", "#7C3AED", 1, new Date().toISOString());

  const ins = db.prepare("INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)");
  for (let d = 1; d <= 5; d++) ins.run(userId, d, 9 * 60, 17 * 60);

  const session = createSession(userId);
  await setSessionCookie(session.id, new Date(session.expires));
  redirect("/dashboard");
}

export async function loginAction(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const row = db.prepare("SELECT id, password_hash FROM users WHERE lower(email) = ?").get(email) as
    | { id: string; password_hash: string }
    | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) redirect("/login?error=invalid");
  const session = createSession(row.id);
  await setSessionCookie(session.id, new Date(session.expires));
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function saveEventTypeAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = str(fd, "id");
  const title = str(fd, "title") || "Untitled event";
  const duration = Math.max(5, Math.min(240, Number(str(fd, "duration", "30")) || 30));
  const slugBase = slugify(str(fd, "slug") || title);
  let slug = slugBase;
  const dupe = db
    .prepare("SELECT id FROM event_types WHERE user_id = ? AND slug = ? AND id != ?")
    .get(user.id, slug, id || "none") as { id: string } | undefined;
  if (dupe) slug = slugBase + "-2";
  const description = str(fd, "description");
  const location = str(fd, "location");
  const color = str(fd, "color") || "#7C3AED";
  const canRR = canUseRoundRobin(user.plan);
  const assignment = canRR && str(fd, "assignment") === "round_robin" ? "round_robin" : "solo";
  const canPay = canUsePayments(user.plan);
  const priceCents = canPay ? Math.max(0, Math.round(Number(str(fd, "price", "0")) * 100)) : 0;
  const currency = (str(fd, "currency", "usd") || "usd").toLowerCase().slice(0, 3);
  const requirePayment = canPay && fd.get("require_payment") === "on" && priceCents > 0 ? 1 : 0;

  if (!id) {
    const count = (db.prepare("SELECT COUNT(*) AS n FROM event_types WHERE user_id = ?").get(user.id) as { n: number }).n;
    if (!canAddEventType(user.plan, count)) redirect("/dashboard/event-types/new?limit=1");
  }

  let eventId = id;
  if (id) {
    db.prepare(
      "UPDATE event_types SET title = ?, slug = ?, description = ?, duration = ?, location = ?, color = ?, assignment = ?, price_cents = ?, currency = ?, require_payment = ? WHERE id = ? AND user_id = ?"
    ).run(title, slug, description, duration, location, color, assignment, priceCents, currency, requirePayment, id, user.id);
  } else {
    eventId = randomUUID();
    db.prepare(
      "INSERT INTO event_types (id, user_id, title, slug, description, duration, location, color, active, created_at, assignment, price_cents, currency, require_payment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)"
    ).run(eventId, user.id, title, slug, description, duration, location, color, new Date().toISOString(), assignment, priceCents, currency, requirePayment);
  }

  if (assignment === "round_robin" && eventId) {
    const teamIds = new Set(getTeamMembers(user.id).map((m) => m.id));
    const selected = fd.getAll("hosts").filter((h): h is string => typeof h === "string" && teamIds.has(h));
    setEventHosts(eventId, selected.length ? selected : [user.id]);
  } else if (eventId) {
    setEventHosts(eventId, []);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteEventTypeAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  db.prepare("DELETE FROM event_types WHERE id = ? AND user_id = ?").run(str(fd, "id"), user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function saveAvailabilityAction(fd: FormData) {
  const user = await requireUser();
  db.prepare("DELETE FROM availability WHERE user_id = ?").run(user.id);
  const ins = db.prepare("INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)");
  for (let d = 0; d < 7; d++) {
    if (fd.get("day_" + d + "_enabled") !== "on") continue;
    const toMin = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + (m || 0);
    };
    const start = toMin(str(fd, "day_" + d + "_start", "09:00"));
    const end = toMin(str(fd, "day_" + d + "_end", "17:00"));
    if (end > start) ins.run(user.id, d, start, end);
  }
  revalidatePath("/dashboard/availability");
  redirect("/dashboard/availability?saved=1");
}

export async function createBookingAction(fd: FormData) {
  const eventTypeId = str(fd, "eventTypeId");
  const startISO = str(fd, "startISO");
  const name = str(fd, "name");
  const email = str(fd, "email");
  const notes = str(fd, "notes");
  if (!eventTypeId || !startISO || !name || !email) redirect("/?error=booking");

  const et = db
    .prepare("SELECT e.*, u.timezone, u.username FROM event_types e JOIN users u ON u.id = e.user_id WHERE e.id = ?")
    .get(eventTypeId) as
    | { id: string; user_id: string; title: string; slug: string; duration: number; timezone: string; username: string; assignment: string; price_cents: number; require_payment: number }
    | undefined;
  if (!et) redirect("/?error=booking");

  const dayISO = new Date(startISO).toLocaleDateString("en-CA", { timeZone: et.timezone });
  const hosts = getEventHosts(et.id, et.user_id, et.assignment);
  const slot = unionSlotsForDay({ hosts, dayISO, duration: et.duration, displayTz: et.timezone }).find((s) => s.startISO === startISO);
  if (!slot) redirect("/" + et.username + "/" + et.slug + "?day=" + dayISO + "&error=slot");
  const hostId = pickHostForSlot(slot.hostIds, startISO, et.duration);
  if (!hostId) redirect("/" + et.username + "/" + et.slug + "?day=" + dayISO + "&error=slot");

  const bookingId = randomUUID();
  const endISO = new Date(new Date(startISO).getTime() + et.duration * 60_000).toISOString();
  db.prepare(
    "INSERT INTO bookings (id, event_type_id, host_id, invitee_name, invitee_email, notes, start_utc, end_utc, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)"
  ).run(bookingId, et.id, hostId, name, email, notes, startISO, endISO, new Date().toISOString());

  const hostPlan = (db.prepare("SELECT plan FROM users WHERE id = ?").get(et.user_id) as { plan: string }).plan;
  const requirePayment = Number(et.require_payment) === 1 && Number(et.price_cents) > 0 && canUsePayments(hostPlan);
  if (requirePayment) {
    db.prepare("UPDATE bookings SET payment_status = 'unpaid', amount_cents = ? WHERE id = ?").run(Number(et.price_cents), bookingId);
  }

  await sendBookingNotifications(bookingId);
  await deliverDueEmails();
  const evt = bookingEventPayload(bookingId);
  if (evt) await emitEvent(evt.ownerId, "booking.created", evt.payload);
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/emails");
  redirect(requirePayment ? "/booking/" + bookingId + "/pay" : "/booking/" + bookingId);
}

export async function markPaidAction(fd: FormData) {
  const id = str(fd, "id");
  db.prepare("UPDATE bookings SET payment_status = 'paid', paid_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  revalidatePath("/booking/" + id);
  redirect("/booking/" + id + "?paid=1");
}

export async function createCheckoutAction(fd: FormData) {
  const id = str(fd, "id");
  const row = db
    .prepare("SELECT b.id, b.invitee_email, b.amount_cents, e.title, e.currency FROM bookings b JOIN event_types e ON e.id = b.event_type_id WHERE b.id = ?")
    .get(id) as { id: string; invitee_email: string; amount_cents: number; title: string; currency: string } | undefined;
  if (!row) redirect("/");
  const base = process.env.APP_URL || "http://localhost:3000";
  const session = await createCheckoutSession({
    bookingId: row.id,
    amountCents: row.amount_cents,
    currency: row.currency || "usd",
    title: row.title,
    email: row.invitee_email,
    successUrl: base + "/booking/" + row.id + "/paid",
    cancelUrl: base + "/booking/" + row.id + "/pay",
  });
  if (!session) redirect("/booking/" + row.id + "/pay?demo=1");
  db.prepare("UPDATE bookings SET stripe_session_id = ? WHERE id = ?").run(session.id, row.id);
  redirect(session.url);
}

export async function cancelBookingAction(fd: FormData) {
  const id = str(fd, "id");
  const cancelEvt = bookingEventPayload(id);
  db.prepare("UPDATE bookings SET status = 'canceled' WHERE id = ?").run(id);
  if (cancelEvt) await emitEvent(cancelEvt.ownerId, "booking.canceled", { ...cancelEvt.payload, status: "canceled" });
  sendCancellationNotifications(id);
  await deliverDueEmails();
  revalidatePath("/dashboard/emails");
  revalidatePath("/booking/" + id);
  revalidatePath("/dashboard/bookings");
  redirect("/booking/" + id);
}

export async function googleDemoConnectAction() {
  const user = await requireUser();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO oauth_connections (id, user_id, provider, account_email, access_token, refresh_token, expires_at, scope, created_at) VALUES (?, ?, 'google-calendar', ?, 'demo', '', ?, 'demo', ?) " +
    "ON CONFLICT(user_id, provider) DO UPDATE SET access_token = 'demo', account_email = excluded.account_email, created_at = excluded.created_at"
  ).run(randomUUID(), user.id, user.email, new Date(Date.now() + 365 * 86400_000).toISOString(), now);
  seedDemoBusy(user.id);
  revalidatePath("/dashboard/integrations");
  redirect("/dashboard/integrations?google=demo");
}

export async function googleSyncAction() {
  const user = await requireUser();
  if (!getConnection(user.id)) redirect("/dashboard/integrations?google=none");
  try {
    const result = await syncBusy(user.id, 30);
    revalidatePath("/dashboard/integrations");
    redirect("/dashboard/integrations?google=synced&n=" + result.busy);
  } catch {
    redirect("/dashboard/integrations?google=syncerror");
  }
}

export async function googleDisconnectAction() {
  const user = await requireUser();
  db.prepare("DELETE FROM oauth_connections WHERE user_id = ? AND provider = 'google-calendar'").run(user.id);
  db.prepare("DELETE FROM calendar_busy WHERE user_id = ? AND provider = 'google-calendar'").run(user.id);
  revalidatePath("/dashboard/integrations");
  redirect("/dashboard/integrations?google=disconnected");
}

export async function connectIntegrationAction(fd: FormData) {
  const user = await requireUser();
  const appId = str(fd, "app_id");
  const app = getIntegration(appId);
  if (!app) redirect("/dashboard/integrations");
  db.prepare(
    "INSERT INTO integration_connections (id, user_id, app_id, status, mode, credentials, connected_at) VALUES (?, ?, ?, 'connected', 'demo', '{}', ?) " +
    "ON CONFLICT(user_id, app_id) DO UPDATE SET status = 'connected', connected_at = excluded.connected_at"
  ).run(randomUUID(), user.id, app.id, new Date().toISOString());
  revalidatePath("/dashboard/integrations");
  redirect("/dashboard/integrations?connected=" + app.id);
}

export async function disconnectIntegrationAction(fd: FormData) {
  const user = await requireUser();
  db.prepare("DELETE FROM integration_connections WHERE user_id = ? AND app_id = ?").run(user.id, str(fd, "app_id"));
  revalidatePath("/dashboard/integrations");
  redirect("/dashboard/integrations");
}

export async function createWebhookAction(fd: FormData) {
  const user = await requireUser();
  const url = str(fd, "url");
  if (!/^https?:\/\//i.test(url)) redirect("/dashboard/webhooks?error=url");
  const events = fd.getAll("events").filter((e): e is string => typeof e === "string");
  createEndpoint(user.id, url, events);
  revalidatePath("/dashboard/webhooks");
  redirect("/dashboard/webhooks?created=1");
}

export async function deleteWebhookAction(fd: FormData) {
  const user = await requireUser();
  const id = str(fd, "id");
  db.prepare("DELETE FROM webhook_deliveries WHERE endpoint_id = ? AND user_id = ?").run(id, user.id);
  db.prepare("DELETE FROM webhook_endpoints WHERE id = ? AND user_id = ?").run(id, user.id);
  revalidatePath("/dashboard/webhooks");
  redirect("/dashboard/webhooks");
}

export async function retryDeliveriesAction() {
  const user = await requireUser();
  await deliverPending(user.id, 50);
  revalidatePath("/dashboard/webhooks");
  redirect("/dashboard/webhooks?retried=1");
}

export async function addTeamMemberAction(fd: FormData) {
  const user = await requireUser();
  const email = str(fd, "email").toLowerCase();
  if (!email || !email.includes("@")) redirect("/dashboard/team?error=email");
  let row = db.prepare("SELECT id FROM users WHERE lower(email) = ?").get(email) as { id: string } | undefined;
  if (!row) {
    let username = slugify(email.split("@")[0]);
    if (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) username += "-" + Math.floor(Math.random() * 900 + 100);
    const id = randomUUID();
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, username, timezone, welcome_message, created_at, plan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, email.split("@")[0], email, hashPasswordSync("demo1234"), username, user.timezone, "Hi! Pick a time that works for you.", new Date().toISOString(), user.plan);
    const ins = db.prepare("INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)");
    for (let d = 1; d <= 5; d++) ins.run(id, d, 9 * 60, 17 * 60);
    row = { id };
  }
  if (row.id !== user.id) {
    db.prepare("INSERT OR IGNORE INTO team_members (owner_id, member_id, created_at) VALUES (?, ?, ?)").run(user.id, row.id, new Date().toISOString());
  }
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team?added=1");
}

export async function removeTeamMemberAction(fd: FormData) {
  const user = await requireUser();
  db.prepare("DELETE FROM team_members WHERE owner_id = ? AND member_id = ?").run(user.id, str(fd, "id"));
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

export async function createApiKeyAction(fd: FormData) {
  const user = await requireUser();
  const name = str(fd, "name") || "Default key";
  const raw = generateApiKey();
  db.prepare("INSERT INTO api_keys (id, user_id, name, prefix, key_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    randomUUID(), user.id, name, raw.slice(0, 12), hashKey(raw), new Date().toISOString()
  );
  revalidatePath("/dashboard/api-keys");
  redirect("/dashboard/api-keys?created=" + encodeURIComponent(raw));
}

export async function revokeApiKeyAction(fd: FormData) {
  const user = await requireUser();
  db.prepare("UPDATE api_keys SET revoked = 1 WHERE id = ? AND user_id = ?").run(str(fd, "id"), user.id);
  revalidatePath("/dashboard/api-keys");
  redirect("/dashboard/api-keys");
}

export async function runEmailsAction() {
  await requireUser();
  await deliverDueEmails();
  revalidatePath("/dashboard/emails");
  redirect("/dashboard/emails?ran=1");
}

export async function testEmailAction(fd: FormData) {
  const user = await requireUser();
  const to = str(fd, "to") || user.email;
  queueTestEmail(user.id, to, user.name);
  await deliverDueEmails();
  revalidatePath("/dashboard/emails");
  redirect("/dashboard/emails?test=1");
}

export async function setPlanAction(fd: FormData) {
  const user = await requireUser();
  const plan = str(fd, "plan");
  if (!PLAN_ORDER.includes(plan)) redirect("/pricing");
  db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, user.id);
  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  redirect("/dashboard?plan=" + plan);
}

export async function updateProfileAction(fd: FormData) {
  const user = await requireUser();
  const name = str(fd, "name") || user.name;
  const username = slugify(str(fd, "username") || user.username);
  const welcome = str(fd, "welcome_message");
  db.prepare("UPDATE users SET name = ?, username = ?, welcome_message = ? WHERE id = ?").run(name, username, welcome, user.id);
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}

export async function updateEventAvailabilityForm(fd: FormData) {
  await saveAvailabilityAction(fd);
}

export async function toggleEventTypeAction(fd: FormData) {
  const user = await requireUser();
  const id = str(fd, "id");
  const next = str(fd, "active") === "1" ? 1 : 0;
  db.prepare("UPDATE event_types SET active = ? WHERE id = ? AND user_id = ?").run(next, id, user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function duplicateEventTypeAction(fd: FormData) {
  const user = await requireUser();
  const id = str(fd, "id");
  const src = db.prepare("SELECT * FROM event_types WHERE id = ? AND user_id = ?").get(id, user.id) as
    | { title: string; slug: string; description: string; duration: number; location: string; color: string; assignment: string; price_cents: number; currency: string; require_payment: number }
    | undefined;
  if (!src) redirect("/dashboard");
  let slug = src.slug + "-copy";
  let n = 2;
  while (db.prepare("SELECT id FROM event_types WHERE user_id = ? AND slug = ?").get(user.id, slug)) {
    slug = src.slug + "-copy-" + n++;
  }
  const newId = randomUUID();
  db.prepare(
    "INSERT INTO event_types (id, user_id, title, slug, description, duration, location, color, active, created_at, assignment, price_cents, currency, require_payment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)"
  ).run(newId, user.id, src.title + " (copy)", slug, src.description, src.duration, src.location, src.color, new Date().toISOString(), src.assignment, src.price_cents, src.currency, src.require_payment);
  const hosts = db.prepare("SELECT user_id, position FROM event_type_hosts WHERE event_type_id = ?").all(id) as { user_id: string; position: number }[];
  const ins = db.prepare("INSERT OR IGNORE INTO event_type_hosts (event_type_id, user_id, position) VALUES (?, ?, ?)");
  for (const h of hosts) ins.run(newId, h.user_id, h.position);
  revalidatePath("/dashboard");
  redirect("/dashboard/event-types/" + newId);
}

export async function createSingleUseLinkAction(fd: FormData) {
  const user = await requireUser();
  const eventTypeId = str(fd, "event_type_id");
  const days = Math.max(1, Math.min(90, Number(str(fd, "days", "7")) || 7));
  const ev = db.prepare("SELECT id FROM event_types WHERE id = ? AND user_id = ?").get(eventTypeId, user.id);
  if (!ev) redirect("/dashboard?link_error=event");
  const token = randomUUID().replace(/-/g, "").slice(0, 20);
  const expires = new Date(Date.now() + days * 86400000).toISOString();
  db.prepare("INSERT INTO single_use_links (id, user_id, event_type_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    randomUUID(), user.id, eventTypeId, token, expires, new Date().toISOString()
  );
  revalidatePath("/dashboard");
  redirect("/dashboard?link_created=" + token);
}

export async function revokeSingleUseLinkAction(fd: FormData) {
  const user = await requireUser();
  db.prepare("DELETE FROM single_use_links WHERE id = ? AND user_id = ?").run(str(fd, "id"), user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function saveScheduleAction(fd: FormData) {
  const user = await requireUser();
  let parsed: { d: number; enabled: boolean; start: string; end: string }[] = [];
  try {
    parsed = JSON.parse(str(fd, "schedule", "[]"));
  } catch {
    parsed = [];
  }
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  db.prepare("DELETE FROM availability WHERE user_id = ?").run(user.id);
  const ins = db.prepare("INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)");
  for (const row of parsed) {
    if (!row || !row.enabled) continue;
    const d = Number(row.d);
    if (!Number.isInteger(d) || d < 0 || d > 6) continue;
    const start = toMin(row.start || "09:00");
    const end = toMin(row.end || "17:00");
    if (end > start) ins.run(user.id, d, start, end);
  }
  revalidatePath("/dashboard/availability");
  redirect("/dashboard/availability?saved=1");
}

export async function updateSettingsAction(fd: FormData) {
  const user = await requireUser();
  const name = str(fd, "name") || user.name;
  const username = slugify(str(fd, "username") || user.username);
  const welcome = str(fd, "welcome_message");
  const timezone = str(fd, "timezone") || user.timezone;
  const password = str(fd, "new_password");
  const current = str(fd, "current_password");

  const taken = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(username, user.id);
  if (taken) redirect("/dashboard/settings?error=username");

  if (password) {
    if (password.length < 6) redirect("/dashboard/settings?error=password");
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (!verifyPassword(current, row.password_hash)) redirect("/dashboard/settings?error=current");
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPasswordSync(password), user.id);
  }

  db.prepare("UPDATE users SET name = ?, username = ?, welcome_message = ?, timezone = ? WHERE id = ?").run(name, username, welcome, timezone, user.id);
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}

export async function createPollAction(fd: FormData) {
  const user = await requireUser();
  const eventTypeId = str(fd, "event_type_id");
  const ev = db.prepare("SELECT id FROM event_types WHERE id = ? AND user_id = ?").get(eventTypeId, user.id);
  if (!ev) redirect("/dashboard/polls?error=event");
  const title = str(fd, "title") || "Meeting poll";
  const description = str(fd, "description");
  const duration = Math.max(5, Math.min(240, Number(str(fd, "duration", "30")) || 30));
  let options: string[] = [];
  try {
    const parsed = JSON.parse(str(fd, "options", "[]"));
    if (Array.isArray(parsed)) options = parsed.filter((x): x is string => typeof x === "string" && !Number.isNaN(Date.parse(x)));
  } catch {
    options = [];
  }
  if (options.length < 2) redirect("/dashboard/polls?error=options");
  const id = randomUUID();
  const token = randomUUID().replace(/-/g, "").slice(0, 20);
  db.prepare("INSERT INTO polls (id, user_id, token, title, description, duration, created_at, event_type_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    id, user.id, token, title, description, duration, new Date().toISOString(), eventTypeId
  );
  const ins = db.prepare("INSERT INTO poll_options (id, poll_id, start_utc, position) VALUES (?, ?, ?, ?)");
  options.forEach((iso, i) => ins.run(randomUUID(), id, iso, i));
  revalidatePath("/dashboard/polls");
  redirect("/dashboard/polls?created=" + token);
}

export async function bookPollWinnerAction(fd: FormData) {
  const user = await requireUser();
  const pollId = str(fd, "poll_id");
  const requested = str(fd, "option_id");
  const poll = db.prepare("SELECT * FROM polls WHERE id = ? AND user_id = ?").get(pollId, user.id) as
    | { id: string; token: string; title: string; duration: number; event_type_id: string | null; booked_booking_id: string | null }
    | undefined;
  if (!poll) redirect("/dashboard/polls");
  if (poll.booked_booking_id) redirect("/booking/" + poll.booked_booking_id);

  const options = db
    .prepare("SELECT o.id, o.start_utc, (SELECT COUNT(*) FROM poll_votes v WHERE v.option_id = o.id) AS votes FROM poll_options o WHERE o.poll_id = ? ORDER BY o.position, o.start_utc")
    .all(poll.id) as { id: string; start_utc: string; votes: number }[];
  if (!options.length) redirect("/dashboard/polls/" + poll.id + "?error=nooptions");

  const winner = requested ? options.find((o) => o.id === requested) : options.slice().sort((a, b) => b.votes - a.votes || a.start_utc.localeCompare(b.start_utc))[0];
  if (!winner) redirect("/dashboard/polls/" + poll.id + "?error=nooptions");

  const eventTypeId = poll.event_type_id ?? (db.prepare("SELECT id FROM event_types WHERE user_id = ? ORDER BY created_at LIMIT 1").get(user.id) as { id: string } | undefined)?.id;
  const et = eventTypeId
    ? (db.prepare("SELECT e.*, u.timezone, u.username FROM event_types e JOIN users u ON u.id = e.user_id WHERE e.id = ?").get(eventTypeId) as
        | { id: string; user_id: string; title: string; slug: string; duration: number; timezone: string; username: string; assignment: string }
        | undefined)
    : undefined;
  if (!et) redirect("/dashboard/polls/" + poll.id + "?error=event");

  const startISO = winner.start_utc;
  const dayISO = new Date(startISO).toLocaleDateString("en-CA", { timeZone: et.timezone });
  const hosts = getEventHosts(et.id, et.user_id, et.assignment);
  const slot = unionSlotsForDay({ hosts, dayISO, duration: et.duration, displayTz: et.timezone }).find((s) => s.startISO === startISO);
  if (!slot) redirect("/dashboard/polls/" + poll.id + "?error=slot");
  const hostId = pickHostForSlot(slot.hostIds, startISO, et.duration);
  if (!hostId) redirect("/dashboard/polls/" + poll.id + "?error=slot");

  const voter = db
    .prepare("SELECT name, email FROM poll_votes WHERE poll_id = ? AND option_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(poll.id, winner.id) as { name: string; email: string } | undefined;
  const inviteeName = voter?.name || user.name;
  const inviteeEmail = voter?.email || user.email;

  const bookingId = randomUUID();
  const endISO = new Date(new Date(startISO).getTime() + et.duration * 60_000).toISOString();
  db.prepare(
    "INSERT INTO bookings (id, event_type_id, host_id, invitee_name, invitee_email, notes, start_utc, end_utc, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)"
  ).run(bookingId, et.id, hostId, inviteeName, inviteeEmail, "Booked from poll: " + poll.title, startISO, endISO, new Date().toISOString());
  db.prepare("UPDATE polls SET booked_option_id = ?, booked_booking_id = ? WHERE id = ?").run(winner.id, bookingId, poll.id);

  await sendBookingNotifications(bookingId);
  await deliverDueEmails();
  const evt = bookingEventPayload(bookingId);
  if (evt) await emitEvent(evt.ownerId, "booking.created", evt.payload);
  revalidatePath("/dashboard/polls");
  revalidatePath("/dashboard/bookings");
  redirect("/booking/" + bookingId);
}

export async function deletePollAction(fd: FormData) {
  const user = await requireUser();
  db.prepare("DELETE FROM polls WHERE id = ? AND user_id = ?").run(str(fd, "id"), user.id);
  revalidatePath("/dashboard/polls");
  redirect("/dashboard/polls");
}

export async function votePollAction(fd: FormData) {
  const token = str(fd, "token");
  const name = str(fd, "name");
  const email = str(fd, "email");
  const poll = db.prepare("SELECT id FROM polls WHERE token = ?").get(token) as { id: string } | undefined;
  if (!poll) redirect("/");
  if (!name || !email) redirect("/p/" + token + "?error=missing");
  const ids = fd.getAll("option").filter((x): x is string => typeof x === "string");
  const valid = db.prepare("SELECT id FROM poll_options WHERE poll_id = ?").all(poll.id) as { id: string }[];
  const validSet = new Set(valid.map((v) => v.id));
  const ins = db.prepare("INSERT INTO poll_votes (id, poll_id, option_id, name, email, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  for (const optionId of ids) if (validSet.has(optionId)) ins.run(randomUUID(), poll.id, optionId, name, email, new Date().toISOString());
  revalidatePath("/p/" + token);
  redirect("/p/" + token + "?voted=1");
}

export async function createRoutingFormAction(fd: FormData) {
  const user = await requireUser();
  const title = str(fd, "title") || "Routing form";
  const description = str(fd, "description");
  const eventTypeId = str(fd, "event_type_id");
  const ev = db.prepare("SELECT id FROM event_types WHERE id = ? AND user_id = ?").get(eventTypeId, user.id);
  if (!ev) redirect("/dashboard/routing?error=event");

  type Q = { key: string; label: string; type: "text" | "select"; options: string[] };
  let questions: Q[] = [];
  try {
    const parsed = JSON.parse(str(fd, "questions", "[]"));
    if (Array.isArray(parsed)) {
      questions = parsed
        .filter((q) => q && typeof q.label === "string" && q.label.trim())
        .map((q, i) => ({
          key: "q" + i,
          label: String(q.label),
          type: q.type === "select" ? "select" : "text",
          options: Array.isArray(q.options) ? q.options.filter((o: unknown): o is string => typeof o === "string" && o.trim() !== "") : [],
        }));
    }
  } catch {
    questions = [];
  }

  const ownedIds = new Set((db.prepare("SELECT id FROM event_types WHERE user_id = ?").all(user.id) as { id: string }[]).map((r) => r.id));
  let branches: { question: string; value: string; event_type_id: string }[] = [];
  try {
    const parsed = JSON.parse(str(fd, "branch_rules", "[]"));
    if (Array.isArray(parsed)) {
      branches = parsed
        .filter((b) => b && typeof b.value === "string" && b.value.trim() && ownedIds.has(String(b.event_type_id)))
        .map((b) => ({ question: String(b.question), value: String(b.value), event_type_id: String(b.event_type_id) }));
    }
  } catch {
    branches = [];
  }

  const token = randomUUID().replace(/-/g, "").slice(0, 20);
  db.prepare("INSERT INTO routing_forms (id, user_id, token, title, description, event_type_id, questions, branch_rules, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    randomUUID(), user.id, token, title, description, eventTypeId, JSON.stringify(questions), JSON.stringify(branches), new Date().toISOString()
  );
  revalidatePath("/dashboard/routing");
  redirect("/dashboard/routing?created=" + token);
}

export async function deleteRoutingFormAction(fd: FormData) {
  const user = await requireUser();
  db.prepare("DELETE FROM routing_forms WHERE id = ? AND user_id = ?").run(str(fd, "id"), user.id);
  revalidatePath("/dashboard/routing");
  redirect("/dashboard/routing");
}

export async function submitRoutingFormAction(fd: FormData) {
  const token = str(fd, "token");
  const name = str(fd, "name");
  const email = str(fd, "email");
  const form = db
    .prepare("SELECT f.id, f.questions, f.branch_rules, f.event_type_id, f.user_id, u.username, e.slug FROM routing_forms f JOIN users u ON u.id = f.user_id JOIN event_types e ON e.id = f.event_type_id WHERE f.token = ?")
    .get(token) as { id: string; questions: string; branch_rules: string; event_type_id: string; user_id: string; username: string; slug: string } | undefined;
  if (!form) redirect("/");
  if (!name || !email) redirect("/r/" + token + "?error=missing");

  let questions: { key: string; label: string; type: string; options: string[] }[] = [];
  try { questions = JSON.parse(form.questions || "[]"); } catch { questions = []; }

  const answers: Record<string, string> = {};
  for (const q of questions) answers[q.label] = str(fd, q.key);

  let routedEventId = form.event_type_id;
  try {
    const branches = JSON.parse(form.branch_rules || "[]") as { question: string; value: string; event_type_id: string }[];
    const match = branches.find((b) => {
      const q = questions.find((x) => x.key === b.question || x.label === b.question);
      const answer = q ? answers[q.label] : "";
      return answer && answer.trim().toLowerCase() === b.value.trim().toLowerCase();
    });
    if (match) routedEventId = match.event_type_id;
  } catch {
    routedEventId = form.event_type_id;
  }

  const routed = db
    .prepare("SELECT e.slug, u.username FROM event_types e JOIN users u ON u.id = e.user_id WHERE e.id = ? AND e.user_id = ?")
    .get(routedEventId, form.user_id) as { slug: string; username: string } | undefined;
  const target = routed ?? { slug: form.slug, username: form.username };

  db.prepare("INSERT INTO routing_submissions (id, form_id, name, email, answers, routed_event_type_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    randomUUID(), form.id, name, email, JSON.stringify(answers), routedEventId, new Date().toISOString()
  );
  const note = Object.entries(answers).filter(([, v]) => v).map(([k, v]) => k + ": " + v).join("\n");
  const qs = new URLSearchParams({ name, email, notes: note });
  redirect("/" + target.username + "/" + target.slug + "?" + qs.toString());
}

export async function outlookDisconnectAction() {
  const user = await requireUser();
  db.prepare("DELETE FROM oauth_connections WHERE user_id = ? AND provider = 'outlook-calendar'").run(user.id);
  db.prepare("DELETE FROM calendar_busy WHERE user_id = ? AND provider = 'outlook-calendar'").run(user.id);
  revalidatePath("/dashboard/integrations");
  redirect("/dashboard/integrations?outlook=disconnected");
}

export async function outlookSyncAction() {
  await requireUser();
  redirect("/api/integrations/outlook/sync");
}

export async function m365DisconnectAction() {
  const user = await requireUser();
  db.prepare("DELETE FROM oauth_connections WHERE user_id = ? AND provider = 'microsoft-365'").run(user.id);
  db.prepare("DELETE FROM calendar_busy WHERE user_id = ? AND provider = 'microsoft-365'").run(user.id);
  revalidatePath("/dashboard/integrations");
  redirect("/dashboard/integrations?m365=disconnected");
}
