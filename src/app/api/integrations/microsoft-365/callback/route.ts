import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { msConnectFromCode, msSyncBusy } from "@/lib/microsoft";

const PROVIDER = "microsoft-365";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || req.nextUrl.origin;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", base));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get("m365_oauth_state")?.value;
  const error = req.nextUrl.searchParams.get("error");

  if (error) return NextResponse.redirect(new URL("/dashboard/integrations?m365=denied", base));
  if (!code) return NextResponse.redirect(new URL("/dashboard/integrations?m365=missing", base));
  if (!state || !expected || state !== expected) return NextResponse.redirect(new URL("/dashboard/integrations?m365=state", base));

  try {
    await msConnectFromCode(user.id, code, PROVIDER);
    let busy = 0;
    try {
      busy = await msSyncBusy(user.id, 30, PROVIDER);
    } catch {
      busy = 0;
    }
    const res = NextResponse.redirect(new URL("/dashboard/integrations?m365=connected&n=" + busy, base));
    res.cookies.delete("m365_oauth_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/dashboard/integrations?m365=error", base));
  }
}
