import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WEBHOOK_EVENTS } from "@/lib/integrations/engine";
import { createWebhookAction, deleteWebhookAction, retryDeliveriesAction } from "@/lib/actions";
import { PageHeader, Notice } from "@/components/PageHeader";

type Endpoint = { id: string; url: string; secret: string; events: string; active: number; created_at: string };
type Delivery = { id: string; event: string; status: string; attempts: number; response_code: number | null; last_error: string | null; created_at: string; url: string };

export default async function WebhooksPage({ searchParams }: { searchParams: Promise<{ created?: string; retried?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { created, retried, error } = await searchParams;
  const endpoints = db
    .prepare("SELECT id, url, secret, events, active, created_at FROM webhook_endpoints WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id) as Endpoint[];
  const deliveries = db
    .prepare("SELECT d.id, d.event, d.status, d.attempts, d.response_code, d.last_error, d.created_at, e.url FROM webhook_deliveries d JOIN webhook_endpoints e ON e.id = d.endpoint_id WHERE d.user_id = ? ORDER BY d.created_at DESC LIMIT 40")
    .all(user.id) as Delivery[];

  return (
    <div className="max-w-4xl">
      <PageHeader title="Webhooks" subtitle="POST booking events to any URL, signed with HMAC-SHA256. Works with Zapier, Make, n8n and your own backend.">
        <form action={retryDeliveriesAction}>
          <button className="btn btn-outline">Retry failed</button>
        </form>
      </PageHeader>

      {created && <Notice>Endpoint created. Copy the signing secret now.</Notice>}
      {retried && <Notice>Retries processed.</Notice>}
      {error && <Notice kind="error">Enter a valid http(s) URL.</Notice>}

      <form action={createWebhookAction} className="mt-5 rounded-xl border border-line bg-white p-5">
        <h2 className="text-[14px] font-semibold">Add endpoint</h2>
        <div className="mt-3 space-y-3">
          <input name="url" required placeholder="https://example.com/webhooks/calcal" className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[13.5px]" />
          <div className="flex flex-wrap gap-3">
            {WEBHOOK_EVENTS.map((e) => (
              <label key={e} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px]">
                <input type="checkbox" name="events" value={e} defaultChecked={e !== "booking.rescheduled" && e !== "invitee.created"} className="h-4 w-4 accent-[#0069ff]" />
                {e}
              </label>
            ))}
          </div>
          <button className="rounded-lg bg-navy px-4 py-2.5 text-[12.5px] font-semibold text-white">Create endpoint</button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {endpoints.length === 0 && <p className="rounded-xl border border-dashed border-line bg-white p-6 text-[13.5px] text-muted">No endpoints yet.</p>}
        {endpoints.map((ep) => {
          let events: string[] = [];
          try { events = JSON.parse(ep.events); } catch { events = []; }
          return (
            <div key={ep.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13px] font-medium">{ep.url}</p>
                  <p className="mt-1 text-[11.5px] text-muted">{events.join(", ")}</p>
                </div>
                <form action={deleteWebhookAction}>
                  <input type="hidden" name="id" value={ep.id} />
                  <button className="rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-medium text-muted hover:border-red-200 hover:text-red-600">Delete</button>
                </form>
              </div>
              <p className="mt-3 break-all rounded-lg bg-mist/60 px-3 py-2 font-mono text-[11px] text-navy/70">
                secret: {ep.secret}
              </p>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-muted">Recent deliveries</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead className="bg-mist/40 text-[10.5px] uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-2.5">Event</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Code</th><th className="px-4 py-2.5">Attempts</th><th className="px-4 py-2.5">Endpoint</th><th className="px-4 py-2.5">When</th></tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-muted">No deliveries yet. Create a booking or press Retry failed.</td></tr>}
            {deliveries.map((d) => (
              <tr key={d.id} className="border-t border-line/70">
                <td className="px-4 py-2.5 font-mono text-[11.5px]">{d.event}</td>
                <td className="px-4 py-2.5">
                  <span className={"rounded-full px-2 py-0.5 text-[10.5px] font-medium " + (d.status === "delivered" ? "bg-green-50 text-green-700" : d.status === "failed" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700")}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">{d.response_code ?? "–"}</td>
                <td className="px-4 py-2.5">{d.attempts}</td>
                <td className="max-w-[220px] truncate px-4 py-2.5 font-mono text-[11px] text-muted">{d.url}</td>
                <td className="px-4 py-2.5 text-muted">{new Date(d.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-mist/40 p-4 text-[12.5px] text-navy/80">
        <p className="font-semibold">Verifying signatures</p>
        <p className="mt-1 text-muted">
          Each request sends <code className="rounded bg-white px-1">X-Calcal-Signature: sha256=HMAC_SHA256(secret, rawBody)</code>. Compare it to the endpoint secret before trusting the payload.
        </p>
      </div>
    </div>
  );
}