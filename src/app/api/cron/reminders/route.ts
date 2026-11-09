import { deliverDueEmails } from "@/lib/email";

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET || "dev-secret";
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== "Bearer " + secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await deliverDueEmails(200);
  return Response.json({ ok: true, ...result, at: new Date().toISOString() });
}

export async function GET(req: Request) { return handle(req); }
export async function POST(req: Request) { return handle(req); }
