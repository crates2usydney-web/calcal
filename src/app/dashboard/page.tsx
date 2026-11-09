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
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Scheduling</h1>
          <p className="mt-1 text-[13.5px] text-muted">Manage your event types and share your booking links.</p>
        </div>
        <Link href="/dashboard/event-types/new" className="btn btn-primary">
          + New event type
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-6 overflow-x-auto border-b border-line text-[13.5px] font-medium">
        <span className="whitespace-nowrap border-b-2 border-brand pb-3 text-brand">Event types</span>
        <span className="whitespace-nowrap pb-3 text-muted">Single-use links</span>
        <span className="whitespace-nowrap pb-3 text-muted">Meeting polls</span>
        <span className="hidden whitespace-nowrap pb-3 text-muted sm:inline">Routing forms</span>
      </div>

      <div className="mt-5 flex items-center gap-2.5 rounded-lg border border-line bg-white px-3.5 py-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="m16.5 16.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <input placeholder="Search event types" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted/70" />
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-14 text-center">
          <p className="text-[16px] font-semibold">No event types yet</p>
          <p className="mt-1 text-[13.5px] text-muted">Create your first event type to start accepting bookings.</p>
          <Link href="/dashboard/event-types/new" className="btn btn-primary mt-5">Create event type</Link>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {events.map((e) => (
            <div key={e.id} className="group flex items-stretch overflow-hidden rounded-xl border border-line bg-white transition hover:shadow-[0_12px_32px_rgba(11,53,88,0.10)]">
              <div className="w-1.5 shrink-0" style={{ background: e.color }} />
              <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={"/dashboard/event-types/" + e.id} className="truncate text-[15.5px] font-semibold hover:text-brand">
                      {e.title}
                    </Link>
                    {!e.active && <span className="rounded bg-[#f1f4f8] px-2 py-0.5 text-[11px] font-medium text-muted">Hidden</span>}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: e.color }} />
                    {e.duration} min <span className="text-line">•</span> {e.location || "No location set"}{" "}
                    <span className="text-line">•</span> {e.assignment === "round_robin" ? "Round robin" : "One-on-One"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton path={"/" + user.username + "/" + e.slug} />
                  <Link href={"/dashboard/event-types/" + e.id} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-ink hover:border-ink/30">
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-line bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Your landing page</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <Link href={"/" + user.username} className="text-[15px] font-medium text-brand hover:underline">
            calcal.app/{user.username}
          </Link>
          <CopyButton path={"/" + user.username} />
        </div>
        <p className="mt-1 text-[12.5px] text-muted">Share this page so people can pick an event type and book time with you.</p>
      </div>
    </div>
  );
}