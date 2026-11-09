import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIES, INTEGRATIONS } from "@/lib/integrations/catalog";
import { connectIntegrationAction, disconnectIntegrationAction, googleDemoConnectAction, googleSyncAction, googleDisconnectAction } from "@/lib/actions";
import { connectionStatus, isGoogleConfigured } from "@/lib/google";

const AUTH_LABEL: Record<string, string> = {
  oauth: "OAuth",
  api_key: "API key",
  webhook: "Webhook",
  ics: "ICS feed",
  smtp: "SMTP",
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; connected?: string; google?: string; n?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { q, category, connected, google, n } = await searchParams;
  const gStatus = connectionStatus(user.id);
  const gConfigured = isGoogleConfigured();
  const connections = db
    .prepare("SELECT app_id FROM integration_connections WHERE user_id = ? AND status = 'connected'")
    .all(user.id) as { app_id: string }[];
  const connectedSet = new Set(connections.map((c) => c.app_id));

  const query = (q ?? "").toLowerCase();
  const filtered = INTEGRATIONS.filter((i) => {
    if (category && i.category !== category) return false;
    if (query && !(i.name.toLowerCase().includes(query) || i.description.toLowerCase().includes(query))) return false;
    return true;
  });
  const connectedIntegration = connected ? INTEGRATIONS.find((i) => i.id === connected) : null;

  return (
    <div className="max-w-5xl">
      <h1 className="text-[26px] font-semibold tracking-tight">Integrations</h1>
      <p className="mt-1 text-[14px] text-muted">
        Connect calendars, video, CRM, payments, marketing and automation tools. {INTEGRATIONS.length} integrations available.
      </p>
      {google && (
        <div className={"mt-4 rounded-lg px-3 py-2 text-[13px] " + (google.includes("error") || google === "denied" || google === "state" || google === "missing" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800")}>
          {google === "demo" && "Google Calendar connected in demo mode — synthetic busy blocks now block booking slots."}
          {google === "connected" && "Google Calendar connected. Busy times synced from your calendar."}
          {google === "synced" && "Synced " + (n ?? "0") + " busy blocks from Google Calendar."}
          {google === "disconnected" && "Google Calendar disconnected. Busy blocks removed."}
          {google === "notconfigured" && "Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or use demo mode below."}
          {google === "denied" && "Google access was denied."}
          {google === "state" && "OAuth state check failed. Please try again."}
          {google === "missing" && "Google did not return an authorization code."}
          {google === "error" && "Google Calendar connection failed. Check server logs."}
          {google === "syncerror" && "Calendar sync failed. Reconnect Google Calendar."}
          {google === "none" && "Connect Google Calendar first."}
        </div>
      )}
      {connectedIntegration && (
        <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-800">
          {connectedIntegration.name} connected (demo mode). Configure provider credentials to go live.
        </div>
      )}

      <form className="mt-5 flex flex-wrap gap-2 rounded-xl border border-line bg-white p-3">
        <input name="q" defaultValue={q ?? ""} placeholder="Search integrations" className="min-w-[240px] flex-1 rounded-lg border border-line px-3 py-2 text-[13.5px]" />
        {category && <input type="hidden" name="category" value={category} />}
        <button className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white">Search</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/integrations" className={"rounded-full border px-3 py-1.5 text-[12px] font-medium " + (!category ? "border-brand bg-brand text-white" : "border-line text-navy hover:border-navy/30")}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={"/dashboard/integrations?category=" + encodeURIComponent(c)} className={"rounded-full border px-3 py-1.5 text-[12px] font-medium " + (category === c ? "border-brand bg-brand text-white" : "border-line text-navy hover:border-navy/30")}>
            {c}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((i) => {
          const isConnected = connectedSet.has(i.id);
          return (
            <div key={i.id} className="flex flex-col rounded-xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mist text-[14px] font-semibold text-brand">
                    {i.name.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold leading-tight">{i.name}</p>
                    <p className="text-[11px] text-muted">{i.category}</p>
                  </div>
                </div>
                {isConnected && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10.5px] font-medium text-green-700">Connected</span>}
              </div>
              <p className="mt-2 flex-1 text-[12px] leading-relaxed text-muted">{i.description}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10.5px] text-gray-600">{AUTH_LABEL[i.auth]}</span>
                {i.id === "google-calendar" ? (
                  gStatus.connected ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-muted">{gStatus.busy} busy · {gStatus.mode}</span>
                      <form action={googleSyncAction}>
                        <button className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium">Sync now</button>
                      </form>
                      <form action={googleDisconnectAction}>
                        <button className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-muted hover:text-red-600">Disconnect</button>
                      </form>
                    </div>
                  ) : gConfigured ? (
                    <a href="/api/integrations/google-calendar/authorize" className="rounded-lg bg-navy px-3 py-1.5 text-[11.5px] font-medium text-white">Connect Google</a>
                  ) : (
                    <form action={googleDemoConnectAction}>
                      <button className="rounded-lg bg-navy px-3 py-1.5 text-[11.5px] font-medium text-white">Connect demo</button>
                    </form>
                  )
                ) : isConnected ? (
                  <form action={disconnectIntegrationAction}>
                    <input type="hidden" name="app_id" value={i.id} />
                    <button className="rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-medium text-muted hover:border-red-200 hover:text-red-600">Disconnect</button>
                  </form>
                ) : (
                  <form action={connectIntegrationAction}>
                    <input type="hidden" name="app_id" value={i.id} />
                    <button className="rounded-lg bg-navy px-3 py-1.5 text-[11.5px] font-medium text-white">Connect</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="mt-8 text-[13.5px] text-muted">No integrations match that search.</p>}

      <div className="mt-8 rounded-xl border border-line bg-mist/40 p-5">
        <p className="text-[13px] font-semibold">Building your own integration?</p>
        <p className="mt-1 text-[12.5px] text-muted">
          Use webhooks + the REST API. Every endpoint is Zapier, Make and n8n compatible.{" "}
          <Link href="/dashboard/webhooks" className="font-medium text-brand">Manage webhooks</Link> ·{" "}
          <Link href="/docs/api" className="font-medium text-brand">API docs</Link>
        </p>
      </div>
    </div>
  );
}