import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { db, verifyPassword } from "./db";

export type User = {
  id: string;
  name: string;
  email: string;
  username: string;
  timezone: string;
  welcome_message: string;
  plan: string;
};

const COOKIE = "cal_sid";
const MAX_AGE = 60 * 60 * 24 * 30;

export function createSession(userId: string) {
  const id = randomUUID();
  const expires = new Date(Date.now() + MAX_AGE * 1000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expires);
  return { id, expires };
}

export async function setSessionCookie(id: string, expires: Date) {
  const store = await cookies();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const sid = store.get(COOKIE)?.value;
  if (!sid) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.username, u.timezone, u.welcome_message, u.plan
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`
    )
    .get(sid, new Date().toISOString()) as User | undefined;
  return row ?? null;
}

export async function login(email: string, password: string): Promise<User | null> {
  const row = db.prepare("SELECT * FROM users WHERE lower(email) = ?").get(email.toLowerCase()) as
    | (User & { password_hash: string })
    | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    timezone: row.timezone,
    welcome_message: row.welcome_message,
    plan: row.plan ?? "free",
  };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("NOT_AUTHENTICATED");
  return user;
}