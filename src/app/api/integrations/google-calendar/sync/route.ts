import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncBusy } from "@/lib/google";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || req.nextUrl.origin;
  const user = await getCurrentUser();
  if (!user) return Response.redirect(new URL("/login", base));
  try {
    const result = await syncBusy(user.id, 30);
    return Response.redirect(new URL("/dashboard/integrations?google=synced&n=" + result.busy, base));
  } catch (err) {
    console.error("google-calendar sync failed:", err);
    return Response.redirect(new URL("/dashboard/integrations?google=syncerror", base));
  }
}