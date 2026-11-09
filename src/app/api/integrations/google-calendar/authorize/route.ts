import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { authUrl, isGoogleConfigured } from "@/lib/google";
import { signState } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || req.nextUrl.origin;
  const user = await getCurrentUser();
  if (!user) return Response.redirect(new URL("/login", base));
  if (!isGoogleConfigured()) {
    return Response.redirect(new URL("/dashboard/integrations?google=notconfigured", base));
  }
  return Response.redirect(authUrl(signState(user.id)));
}
