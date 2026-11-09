import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CopyButton } from "@/components/CopyButton";
import { PageHeader, Notice } from "@/components/PageHeader";
import { RoutingFormComposer } from "@/components/RoutingFormComposer";
import { deleteRoutingFormAction } from "@/lib/actions";

type Form = { id: string; token: string; title: string; description: string; event_title: string; questions: string; submissions: number; created_at: string };

export default async function RoutingPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const sp = await searchParams;

  const events = (db.prepare("SELECT id, title FROM event_types WHERE user_id = ? ORDER BY created_at").all(user.id) as { id: string; title: string }[]).map((e) => ({
    id: String(e.id),
    title: String(e.title),
  }));
  const forms = db
    .prepare(
      "SELECT f.id, f.token, f.title, f.description, f.questions, f.created_at, e.title AS event_title, " +
      "(SELECT COUNT(*) FROM routing_submissions s WHERE s.form_id = f.id) AS submissions " +
      "FROM routing_forms f JOIN event_types e ON e.id = f.event_type_id WHERE f.user_id = ? ORDER BY f.created_at DESC"
    )
    .all(user.id) as Form[];

  return (
    <div className="max-w-4xl">
      <PageHeader title="Routing forms" subtitle="Ask a few questions before booking, then route invitees to the right event type.">
        <Link href="/dashboard" className="btn btn-outline">Back to scheduling</Link>
      </PageHeader>

      {sp.error === "event" && <Notice kind="error">Pick an event type to route to.</Notice>}
      {sp.created && <Notice>Routing form created. Share <span className="font-mono">/r/{sp.created}</span>.</Notice>}

      <div className="mt-6">
        {events.length ? (
          <RoutingFormComposer events={events} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <p className="text-[15px] font-semibold">Create an event type first</p>
            <p className="mt-1 text-[13px] text-muted">Routing forms send people to an event type.</p>
            <Link href="/dashboard/event-types/new" className="btn btn-primary mt-4">New event type</Link>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {forms.map((f) => {
          let qs: { key: string; label: string }[] = [];
          try { qs = JSON.parse(f.questions || "[]"); } catch { qs = []; }
          return (
            <div key={f.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[15.5px] font-semibold">{f.title}</p>
                  {f.description && <p className="mt-0.5 text-[12.5px] text-muted">{f.description}</p>}
                  <p className="mt-1 text-[12.5px] text-muted">
                    Routes to <span className="font-medium text-ink">{f.event_title}</span> · {qs.length} questions · {f.submissions} {f.submissions === 1 ? "response" : "responses"}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-brand/80">calcal.app/r/{f.token}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton path={"/r/" + f.token} />
                  <a href={"/r/" + f.token} className="btn btn-outline">Open</a>
                  <form action={deleteRoutingFormAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button className="rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-muted hover:border-red-200 hover:text-red-600">Delete</button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}