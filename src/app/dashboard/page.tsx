import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CopyButton } from "@/components/CopyButton";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: number;
  location: string;
  color: string;
  active: number;
  assignment: string;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const events = db
    .prepare("SELECT id, title, slug, description, duration, location, color, active FROM event_types WHERE user_id = ? ORDER BY created_at")
    .all(user.id) as EventRow[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Scheduling</h1>
          <p className="mt-1 text-[14px] text-muted">Manage your event types and share your booking links.</p>
        </div>
        <Link href="/dashboard/event-types/new" className="rounded-lg bg-navy px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-soft">
          + New event type
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between border-b border-line pb-3">
        <div className="flex gap-5 text-[13.5px] font-medium">
          <span className="border-b-2 border-brand pb-3 text-brand">Event types</span>
          <span className="pb-3 text-muted">Single-use links</span>
          <span className="pb-3 text-muted">Meeting polls</span>
          <span className="hidden pb-3 text-muted sm:inline">Routing forms</span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5">
        <span className="text-muted">⌕</span>
        <input placeholder="Search event types" className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted/70" />
      </div>

      {events.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="text-[16px] font-semibold">No event types yet</p>
          <p className="mt-1 text-[14px] text-muted">Create your first event type to start accepting bookings.</p>
          <Link href="/dashboard/event-types/new" className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-[13px] font-semibold text-white">
            Create event type
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {events.map((e) => (
            <div key={e.id} className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="flex">
                <div className="w-1.5 shrink-0" style={{ background: e.color }} />
                <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={"/dashboard/event-types/" + e.id} className="truncate text-[16px] font-semibold hover:text-brand">
                        {e.title}
                      </Link>
                      {!e.active && <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">Hidden</span>}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: e.color }} />
                      {e.duration} min <span className="text-line">•</span> {e.location || "No location set"}{" "}
                      <span className="text-line">•</span> {e.assignment === "round_robin" ? "Round robin" : "One-on-One"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton path={"/" + user.username + "/" + e.slug} />
                    <Link href={"/dashboard/event-types/" + e.id} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium hover:border-navy/30">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-line bg-white p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Your landing page</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <Link href={"/" + user.username} className="text-[15px] font-medium text-brand hover:underline">
            calcal.app/{user.username}
          </Link>
          <CopyButton path={"/" + user.username} />
        </div>
      </div>
    </div>
  );
}