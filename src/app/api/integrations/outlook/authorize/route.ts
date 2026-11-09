import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { isMicrosoftConfigured, msAuthUrl } from "@/lib/microsoft";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || req.nextUrl.origin;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", base));
  if (!isMicrosoftConfigured()) return NextResponse.redirect(new URL("/dashboard/integrations/outlook-calendar?outlook=notconfigured", base));
  const state = randomUUID();
  const res = NextResponse.redirect(msAuthUrl(state));
  res.cookies.set("ms_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  res.cookies.set("ms_oauth_provider", "outlook-calendar", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}