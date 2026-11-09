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

  if (error) return NextResponse.redirect(new URL("/dashboard/integrations?outlook=denied", base));
  if (!code) return NextResponse.redirect(new URL("/dashboard/integrations?outlook=missing", base));
  if (!state || !expected || state !== expected) return NextResponse.redirect(new URL("/dashboard/integrations?outlook=state", base));

  try {
    await msConnectFromCode(user.id, code);
    let busy = 0;
    try {
      busy = await msSyncBusy(user.id, 30);
    } catch {
      busy = 0;
    }
    const res = NextResponse.redirect(new URL("/dashboard/integrations?outlook=connected&n=" + busy, base));
    res.cookies.delete("ms_oauth_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/dashboard/integrations?outlook=error", base));
  }
}
