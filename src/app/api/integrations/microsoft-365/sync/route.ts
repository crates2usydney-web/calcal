import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { msSyncBusy } from "@/lib/microsoft";

const PROVIDER = "microsoft-365";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || req.nextUrl.origin;
  const user = await getCurrentUser();
  if (!user) return Response.redirect(new URL("/login", base));
  try {
    const busy = await msSyncBusy(user.id, 30, PROVIDER);
    return Response.redirect(new URL("/dashboard/integrations?m365=synced&n=" + busy, base));
  } catch (err) {
    console.error("microsoft-365 sync failed:", err);
    return Response.redirect(new URL("/dashboard/integrations?m365=syncerror", base));
  }
}
