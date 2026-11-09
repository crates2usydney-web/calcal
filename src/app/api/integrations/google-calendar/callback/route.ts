import { NextRequest } from "next/server";
import { verifyState } from "@/lib/crypto";
import { exchangeCode, saveConnection, syncBusy } from "@/lib/google";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || req.nextUrl.origin;
  const params = req.nextUrl.searchParams;
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");

  if (error) return Response.redirect(new URL("/dashboard/integrations?google=denied", base));
  const userId = state ? verifyState(state) : null;
  if (!userId) return Response.redirect(new URL("/dashboard/integrations?google=state", base));
  if (!code) return Response.redirect(new URL("/dashboard/integrations?google=missing", base));

  try {
    const tokens = await exchangeCode(code);
    let email = "Google Calendar";
    try {
      const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: "Bearer " + tokens.access_token },
      });
      if (info.ok) {
        const data = (await info.json()) as { email?: string };
        if (data.email) email = data.email;
      }
    } catch {
      // best effort
    }
    saveConnection(userId, tokens, email);
    await syncBusy(userId, 30);
    return Response.redirect(new URL("/dashboard/integrations?google=connected", base));
  } catch (err) {
    console.error("google callback failed", err);
    return Response.redirect(new URL("/dashboard/integrations?google=error", base));
  }
}
