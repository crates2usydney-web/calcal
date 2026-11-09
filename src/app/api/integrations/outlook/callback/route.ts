import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { msConnectFromCode, msSyncBusy } from "@/lib/microsoft";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || req.nextUrl.origin;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", base));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get("ms_oauth_state")?.value;
  const error = req.nextUrl.searchParams.get("error");
  const provider = req.cookies.get("ms_oauth_provider")?.value === "microsoft-365" ? "microsoft-365" : "outlook-calendar";
  const key = provider === "microsoft-365" ? "m365" : "outlook";

  if (error) return NextResponse.redirect(new URL("/dashboard/integrations?" + key + "=denied", base));
  if (!code) return NextResponse.redirect(new URL("/dashboard/integrations?" + key + "=missing", base));
  if (!state || !expected || state !== expected) return NextResponse.redirect(new URL("/dashboard/integrations?" + key + "=state", base));

  try {
    await msConnectFromCode(user.id, code, provider);
    let busy = 0;
    try {
      busy = await msSyncBusy(user.id, 30, provider);
    } catch {
      busy = 0;
    }
    const res = NextResponse.redirect(new URL("/dashboard/integrations?" + key + "=connected&n=" + busy, base));
    res.cookies.delete("ms_oauth_state");
    res.cookies.delete("ms_oauth_provider");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/dashboard/integrations?" + key + "=error", base));
  }
}