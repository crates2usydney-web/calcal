import { apiUser, json, unauthorized } from "@/lib/api-auth";
import { deliverDueEmails } from "@/lib/email";

export async function POST(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const result = await deliverDueEmails(200);
  return json({ ok: true, ...result });
}
