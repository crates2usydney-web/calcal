import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Notice } from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { deleteWebhookAction, retryDeliveriesAction } from "@/lib/actions";

type Endpoint = { id: string; url: string; secret: string; events: string; active: number; created_at: string };
type Delivery = { id: string; event: string; status: string; attempts: number; response_code: number | null; last_error: string | null; created_at: string };

export default async function WebhookDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ retried?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const ep = db.prepare("SELECT id, url, secret, events, active, created_at FROM webhook_endpoints WHERE id = ? AND user_id = ?").get(id, user.id) as Endpoint | undefined;
  if (!ep) notFound();

  let events: string[] = [];
  try { events = JSON.parse(ep.events); } catch { events = []; }

  const deliveries = db
    .prepare("SELECT id, event, status, attempts, response_code, last_error, created_at FROM webhook_deliveries WHERE endpoint_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(ep.id, user.id) as Delivery[];

  const delivered = deliveries.filter((d) => d.status === "delivered").length;
  const failed = deliveries.filter((d) => d.status === "failed").length;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/webhooks" className="text-[13px] font-medium text-muted hover:text-ink">‹ Webhooks</Link>

      <div className="mt-3">
        <PageHeader title="Webhook endpoint" subtitle={ep.url}>
          <form action={retryDeliveriesAction}><button className="btn btn-outline">Retry failed</button></form>
          <form action={deleteWebhookAction}>
            <input type="hidden" name="id" value={ep.id} />
            <button className="rounded-full border border-red-200 px-4 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50">Delete</button>
          </form>
        </PageHeader>
      </div>

      {sp.retried && <Notice>Retries processed.</Notice>}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[["Delivered", delivered], ["Failed", failed], ["Total", deliveries.length]].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
            <p className="mt-1 text-[22px] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold">Signing secret</p>
            <p className="text-[12px] text-muted">Use this to verify the <code className="rounded bg-cloud px-1">X-Calcal-Signature</code> header.</p>
          </div>
          <CopyButton text={ep.secret} label="Copy secret" />
        </div>
        <code className="mt-3 block break-all rounded-lg bg-cloud px-3 py-2 font-mono text-[11.5px] text-ink/80">{ep.secret}</code>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white p-5">
        <p className="text-[13px] font-semibold">Subscribed events</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {events.length ? events.map((e) => <span key={e} className="rounded-full bg-cloud px-2.5 py-1 font-mono text-[11.5px] text-ink/80">{e}</span>) : <span className="text-[12px] text-muted">All events</span>}
        </div>
        <p className="mt-3 text-[12px] text-muted">Created {new Date(ep.created_at).toLocaleString()} · {ep.active ? "Active" : "Paused"}</p>
      </div>

      <h2 className="mt-6 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">Deliveries</h2>
      <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white">
        <div className="hidden grid-cols-[1.4fr_90px_70px_80px_120px] gap-3 border-b border-line bg-cloud/60 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted sm:grid">
          <span>Event</span><span>Status</span><span>Code</span><span>Attempts</span><span>When</span>
        </div>
        <div className="divide-y divide-line">
          {deliveries.length === 0 && <p className="p-5 text-[13px] text-muted">No deliveries yet. Create a booking or press Retry failed.</p>}
          {deliveries.map((d) => (
            <div key={d.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[1.4fr_90px_70px_80px_120px] sm:items-center sm:gap-3">
              <span className="font-mono text-[12px]">{d.event}</span>
              <span className={"w-fit rounded-full px-2 py-0.5 text-[10.5px] font-medium " + (d.status === "delivered" ? "bg-green-50 text-green-700" : d.status === "failed" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700")}>{d.status}</span>
              <span className="text-[12px]">{d.response_code ?? "–"}</span>
              <span className="text-[12px]">{d.attempts}</span>
              <span className="text-[12px] text-muted">{new Date(d.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
