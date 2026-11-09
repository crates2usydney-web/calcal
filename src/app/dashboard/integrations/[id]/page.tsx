import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIES, getIntegration, INTEGRATIONS } from "@/lib/integrations/catalog";
import { connectIntegrationAction, disconnectIntegrationAction, googleDemoConnectAction, googleSyncAction, googleDisconnectAction } from "@/lib/actions";
import { connectionStatus, isGoogleConfigured } from "@/lib/google";
import { PageHeader, Notice } from "@/components/PageHeader";

const AUTH_LABEL: Record<string, string> = { oauth: "OAuth", api_key: "API key", webhook: "Webhook", ics: "ICS feed", smtp: "SMTP" };

export default async function IntegrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const app = getIntegration(id);
  if (!app) notFound();

  const conn = db
    .prepare("SELECT status, mode, connected_at FROM integration_connections WHERE user_id = ? AND app_id = ?")
    .get(user.id, app.id) as { status: string; mode: string; connected_at: string } | undefined;
  const connected = conn?.status === "connected";
  const isGoogle = app.id === "google-calendar";
  const gStatus = isGoogle ? connectionStatus(user.id) : null;
  const gConfigured = isGoogle ? isGoogleConfigured() : false;

  const related = INTEGRATIONS.filter((i) => i.category === app.category && i.id !== app.id).slice(0, 6);

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/integrations" className="text-[13px] font-medium text-muted hover:text-ink">‹ Integrations</Link>

      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-white text-[20px] font-semibold text-ink">
          {app.name.slice(0, 1)}
        </div>
        <div className="flex-1">
          <PageHeader title={app.name} subtitle={app.description}>
            {connected ? (
              <>
                <span className="rounded-full bg-green-50 px-3 py-1 text-[12px] font-semibold text-green-700">Connected</span>
                {isGoogle ? (
                  <form action={googleDisconnectAction}><button className="btn btn-outline">Disconnect</button></form>
                ) : (
                  <form action={disconnectIntegrationAction}>
                    <input type="hidden" name="app_id" value={app.id} />
                    <button className="btn btn-outline">Disconnect</button>
                  </form>
                )}
              </>
            ) : isGoogle ? (
              <>
                <form action={googleDemoConnectAction}><button className="btn btn-primary">Connect demo</button></form>
                {!gConfigured && <span className="text-[11.5px] text-muted">OAuth keys not configured</span>}
              </>
            ) : (
              <form action={connectIntegrationAction}>
                <input type="hidden" name="app_id" value={app.id} />
                <button className="btn btn-primary">Connect</button>
              </form>
            )}
          </PageHeader>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Category</p>
          <p className="mt-1 text-[13.5px] font-medium">{app.category}</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Authentication</p>
          <p className="mt-1 text-[13.5px] font-medium">{AUTH_LABEL[app.auth] ?? app.auth}</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Status</p>
          <p className="mt-1 text-[13.5px] font-medium">{connected ? "Connected" : "Not connected"}</p>
        </div>
      </div>

      {isGoogle && gStatus?.connected && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
          <div>
            <p className="text-[13px] font-semibold">Calendar sync</p>
            <p className="text-[12px] text-muted">
              {gStatus.mode === "demo" ? "Demo mode — synthetic busy blocks." : "Live Google Calendar connection."} Busy blocks currently block booking slots.
            </p>
          </div>
          <form action={googleSyncAction}><button className="btn btn-outline">Sync now</button></form>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-line bg-white p-5">
        <h2 className="text-[13.5px] font-semibold">What this integration does</h2>
        <ul className="mt-2 space-y-1.5 text-[13px] text-muted">
          <li>• Connects {app.name} to your calcal workspace.</li>
          <li>• Booking events fire the matching workflow automatically.</li>
          <li>• Disconnecting stops future syncs and removes stored credentials.</li>
        </ul>
        <p className="mt-3 text-[12px] text-muted">Connections run in demo mode until provider credentials are configured on the server.</p>
      </div>

      {related.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">More in {app.category}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.id} href={"/dashboard/integrations/" + r.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 hover:border-ink/20">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cloud text-[12px] font-semibold">{r.name.slice(0, 1)}</span>
                <div>
                  <p className="text-[13px] font-medium">{r.name}</p>
                  <p className="line-clamp-1 text-[11.5px] text-muted">{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
