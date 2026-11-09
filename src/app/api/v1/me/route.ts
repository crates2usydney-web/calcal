import { apiUser, json, unauthorized } from "@/lib/api-auth";

export async function GET(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  return json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    timezone: user.timezone,
    plan: user.plan,
    links: { profile: "/" + user.username, api: "/api/v1" },
  });
}
