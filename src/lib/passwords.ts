import { scryptSync, randomBytes } from "node:crypto";

export function hashPasswordSync(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
