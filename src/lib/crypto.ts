import { createCipheriv, createDecipheriv, scryptSync, randomBytes, createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.APP_SECRET || "calcal-dev-secret-change-me";

function key(): Buffer {
  return scryptSync(SECRET, "calcal-oauth-v1", 32);
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function signState(userId: string): string {
  const exp = Date.now() + 10 * 60_000;
  const payload = userId + "." + exp;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload + "." + sig).toString("base64url");
}

export function verifyState(state: string): string | null {
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const [userId, exp, sig] = parts;
    const expected = createHmac("sha256", SECRET).update(userId + "." + exp).digest("hex");
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Number(exp) < Date.now()) return null;
    return userId;
  } catch {
    return null;
  }
}
