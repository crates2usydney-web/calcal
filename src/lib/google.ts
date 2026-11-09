import { randomUUID } from "node:crypto";
import { db } from "./db";
import { decrypt, encrypt } from "./crypto";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";
export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export type GoogleConnection = {
  id: string;
  user_id: string;
  provider: string;
  account_email: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
};

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(): string {
  return (process.env.APP_URL || "http://localhost:3000") + "/api/integrations/google-calendar/callback";
}

export function authUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return AUTH_URL + "?" + params.toString();
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; scope?: string };

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("google token exchange failed: " + res.status + " " + (await res.text()).slice(0, 200));
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(conn: GoogleConnection): Promise<GoogleConnection> {
  if (!conn.refresh_token) return conn;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: decrypt(conn.refresh_token),
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("google refresh failed: " + res.status);
  const data = (await res.json()) as TokenResponse;
  const expires = new Date(Date.now() + (data.expires_in - 60) * 1000).toISOString();
  db.prepare("UPDATE oauth_connections SET access_token = ?, expires_at = ? WHERE id = ?").run(encrypt(data.access_token), expires, conn.id);
  return { ...conn, access_token: encrypt(data.access_token), expires_at: expires };
}

export function getConnection(userId: string, provider = "google-calendar"): GoogleConnection | null {
  const row = db
    .prepare("SELECT * FROM oauth_connections WHERE user_id = ? AND provider = ?")
    .get(userId, provider) as GoogleConnection | undefined;
  return row ?? null;
}

export function saveConnection(userId: string, tokens: TokenResponse, accountEmail: string) {
  const existing = getConnection(userId);
  const expires = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString();
  const access = encrypt(tokens.access_token);
  const refresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : existing?.refresh_token ?? "";
  if (existing) {
    db.prepare("UPDATE oauth_connections SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ?, account_email = ? WHERE id = ?").run(
      access, refresh, expires, tokens.scope ?? GOOGLE_SCOPE, accountEmail, existing.id
    );
  } else {
    db.prepare("INSERT INTO oauth_connections (id, user_id, provider, account_email, access_token, refresh_token, expires_at, scope, created_at) VALUES (?, ?, 'google-calendar', ?, ?, ?, ?, ?, ?)").run(
      randomUUID(), userId, accountEmail, access, refresh, expires, tokens.scope ?? GOOGLE_SCOPE, new Date().toISOString()
    );
  }
}

export async function syncBusy(userId: string, days = 30): Promise<{ busy: number; mode: "live" | "demo" }> {
  const conn = getConnection(userId);
  if (!conn) throw new Error("not connected");
  if (conn.provider !== "google-calendar") throw new Error("unsupported provider");

  const from = new Date();
  const to = new Date(Date.now() + days * 86400_000);

  if (conn.access_token === "demo") {
    const count = seedDemoBusy(userId, from, to);
    return { busy: count, mode: "demo" };
  }

  let active = conn;
  if (new Date(conn.expires_at).getTime() < Date.now() + 60_000) active = await refreshAccessToken(conn);

  const res = await fetch(FREEBUSY_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + decrypt(active.access_token), "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: "primary" }] }),
  });
  if (!res.ok) throw new Error("freebusy failed: " + res.status);
  const data = (await res.json()) as { calendars?: Record<string, { busy?: { start: string; end: string }[] }> };
  const busy = data.calendars?.primary?.busy ?? [];

  db.prepare("DELETE FROM calendar_busy WHERE user_id = ? AND provider = 'google-calendar' AND start_utc >= ?").run(userId, from.toISOString());
  const ins = db.prepare("INSERT INTO calendar_busy (id, user_id, provider, start_utc, end_utc, source, created_at) VALUES (?, ?, 'google-calendar', ?, ?, 'freebusy', ?)");
  for (const b of busy) ins.run(randomUUID(), userId, b.start, b.end, new Date().toISOString());
  return { busy: busy.length, mode: "live" };
}

export function seedDemoBusy(userId: string, from = new Date(), to = new Date(Date.now() + 30 * 86400_000)): number {
  db.prepare("DELETE FROM calendar_busy WHERE user_id = ? AND provider = 'google-calendar'").run(userId);
  const ins = db.prepare("INSERT INTO calendar_busy (id, user_id, provider, start_utc, end_utc, source, created_at) VALUES (?, ?, 'google-calendar', ?, ?, 'demo', ?)");
  const tz = (db.prepare("SELECT timezone FROM users WHERE id = ?").get(userId) as { timezone: string } | undefined)?.timezone ?? "America/New_York";
  let count = 0;
  const day = new Date(from);
  day.setUTCHours(0, 0, 0, 0);
  while (day.getTime() < to.getTime()) {
    const dayISO = formatInTimeZone(day, tz, "yyyy-MM-dd");
    const weekday = new Date(dayISO + "T00:00:00Z").getUTCDay();
    if (weekday >= 1 && weekday <= 5) {
      const lunch = fromZonedTime(dayISO + "T12:00:00", tz);
      const standup = fromZonedTime(dayISO + "T15:00:00", tz);
      if (lunch.getTime() > from.getTime()) {
        ins.run(randomUUID(), userId, lunch.toISOString(), new Date(lunch.getTime() + 3600_000).toISOString(), new Date().toISOString());
        count++;
      }
      if (standup.getTime() > from.getTime()) {
        ins.run(randomUUID(), userId, standup.toISOString(), new Date(standup.getTime() + 1800_000).toISOString(), new Date().toISOString());
        count++;
      }
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return count;
}

export function busyForRange(userId: string, fromISO: string, toISO: string) {
  return db
    .prepare("SELECT start_utc, end_utc FROM calendar_busy WHERE user_id = ? AND start_utc < ? AND end_utc > ?")
    .all(userId, toISO, fromISO) as { start_utc: string; end_utc: string }[];
}

export function connectionStatus(userId: string) {
  const conn = getConnection(userId);
  if (!conn) return { connected: false as const };
  const busy = (db.prepare("SELECT COUNT(*) AS n FROM calendar_busy WHERE user_id = ? AND provider = 'google-calendar'").get(userId) as { n: number }).n;
  return {
    connected: true as const,
    mode: conn.access_token === "demo" ? ("demo" as const) : ("live" as const),
    email: conn.account_email,
    scope: conn.scope,
    busy,
  };
}