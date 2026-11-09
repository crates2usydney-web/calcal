import { db } from "@/lib/db";

export async function GET() {
  try {
    const row = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    return Response.json({ ok: true, db: true, users: row.n, version: "1.0.0", time: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false, db: false }, { status: 500 });
  }
}
