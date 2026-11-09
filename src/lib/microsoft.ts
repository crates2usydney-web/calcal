import { randomUUID } from "node:crypto";
import { db } from "./db";
import { decrypt, encrypt } from "./crypto";

const AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH = "https://graph.microsoft.com/v1.0";
export const MS_SCOPES = "offline_access User.Read Calendars.Read";

type Conn = {
  id: string;
  user_id: string;
  provider: string;
  account_email: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
};

export function isMicrosoftConfigured(): boolean {
  return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
}

export function msRedirectUri(): string {
  return (process.env.APP_URL || "http://localhost:3000") + "/api/integrations/outlook/callback";
}

export function msAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: msRedirectUri(),
    response_mode: "query",
    scope: MS_SCOPES,
    state,
    prompt: "consent",
  });
  return AUTH_URL + "?" + params.toString();
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; scope?: string };

export async function msExchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
      code,
      redirect_uri: msRedirectUri(),
      grant_type: "authorization_code",
      scope: MS_SCOPES,
    }),
  });
  if (!res.ok) throw new Error("microsoft token exchange failed: " + res.status + " " + (await res.text()).slice(0, 200));
  return (await res.json()) as TokenResponse;
}

async function msRefresh(conn: Conn): Promise<Conn> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
      refresh_token: decrypt(conn.refresh_token),
      grant_type: "refresh_token",
      scope: MS_SCOPES,
    }),
  });
  if (!res.ok) throw new Error("microsoft refresh failed: " + res.status);
  const data = (await res.json()) as TokenResponse;
  const expires = new Date(Date.now() + data.expires_in * 1000).toISOString();
  db.prepare("UPDATE oauth_connections SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ? WHERE id = ?").run(
    encrypt(data.access_token),
    encrypt(data.refresh_token || decrypt(conn.refresh_token)),
    expires,
    data.scope || conn.scope,
    conn.id
  );
  return { ...conn, access_token: encrypt(data.access_token), refresh_token: data.refresh_token ? encrypt(data.refresh_token) : conn.refresh_token, expires_at: expires };
}

export function getMsConnection(userId: string): Conn | undefined {
  return db
    .prepare("SELECT id, user_id, provider, account_email, access_token, refresh_token, expires_at, scope FROM oauth_connections WHERE user_id = ? AND provider = 'outlook-calendar'")
    .get(userId) as Conn | undefined;
}

export function saveMsConnection(userId: string, tokens: TokenResponse, email: string) {
  const expires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  db.prepare(
    "INSERT INTO oauth_connections (id, user_id, provider, account_email, access_token, refresh_token, expires_at, scope, created_at) VALUES (?, ?, 'outlook-calendar', ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(user_id, provider) DO UPDATE SET account_email = excluded.account_email, access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, scope = excluded.scope, created_at = excluded.created_at"
  ).run(randomUUID(), userId, email, encrypt(tokens.access_token), encrypt(tokens.refresh_token ?? ""), expires, tokens.scope ?? MS_SCOPES, new Date().toISOString());
}

async function graphMe(accessToken: string): Promise<string> {
  const res = await fetch(GRAPH + "/me?$select=mail,userPrincipalName", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!res.ok) return "Outlook Calendar";
  const data = (await res.json()) as { mail?: string; userPrincipalName?: string };
  return data.mail || data.userPrincipalName || "Outlook Calendar";
}

export async function msConnectFromCode(userId: string, code: string) {
  const tokens = await msExchangeCode(code);
  const email = await graphMe(tokens.access_token);
  saveMsConnection(userId, tokens, email);
  return email;
}

export async function msSyncBusy(userId: string, days = 30): Promise<number> {
  let conn = getMsConnection(userId);
  if (!conn) throw new Error("not connected");
  if (new Date(conn.expires_at).getTime() < Date.now() + 60_000) conn = await msRefresh(conn);

  const from = new Date();
  const to = new Date(Date.now() + days * 86400_000);
  const url = GRAPH + "/me/calendarView?startDateTime=" + encodeURIComponent(from.toISOString()) + "&endDateTime=" + encodeURIComponent(to.toISOString()) + "&$select=start,end&$top=500";

  const load = async (token: string) =>
    fetch(url, { headers: { Authorization: "Bearer " + token, Prefer: 'outlook.timezone="UTC"' } });

  let res = await load(decrypt(conn.access_token));
  if (res.status === 401) {
    conn = await msRefresh(conn);
    res = await load(decrypt(conn.access_token));
  }
  if (!res.ok) throw new Error("graph calendarView failed: " + res.status + " " + (await res.text()).slice(0, 160));

  const data = (await res.json()) as { value?: { start: { dateTime: string }; end: { dateTime: string } }[] };
  const events = data.value ?? [];

  db.prepare("DELETE FROM calendar_busy WHERE user_id = ? AND provider = 'outlook-calendar' AND start_utc >= ?").run(userId, from.toISOString());
  const ins = db.prepare("INSERT INTO calendar_busy (id, user_id, provider, start_utc, end_utc, source, created_at) VALUES (?, ?, 'outlook-calendar', ?, ?, 'graph', ?)");
  for (const ev of events) {
    const start = new Date(ev.start.dateTime.endsWith("Z") ? ev.start.dateTime : ev.start.dateTime + "Z").toISOString();
    const end = new Date(ev.end.dateTime.endsWith("Z") ? ev.end.dateTime : ev.end.dateTime + "Z").toISOString();
    ins.run(randomUUID(), userId, start, end, new Date().toISOString());
  }
  return events.length;
}
