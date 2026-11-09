import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventTypesBoard } from "@/components/EventTypesBoard";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  duration: number;
  location: string;
  color: string;
  active: number;
  assignment: string;
};

type LinkRow = {
  id: string;
  token: string;
  event_title: string;
  event_slug: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ link_created?: string; link_error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const sp = await searchParams;

  const events = (db
    .prepare("SELECT id, title, slug, duration, location, color, active, assignment FROM event_types WHERE user_id = ? ORDER BY created_at")
    .all(user.id) as EventRow[]).map((e) => ({
      id: String(e.id), title: String(e.title), slug: String(e.slug), duration: Number(e.duration),
      location: String(e.location), color: String(e.color), active: Number(e.active), assignment: String(e.assignment),
    }));

  const links = (db
    .prepare(
      "SELECT l.id, l.token, l.expires_at, l.used_at, l.created_at, e.title AS event_title, e.slug AS event_slug " +
      "FROM single_use_links l JOIN event_types e ON e.id = l.event_type_id " +
      "WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT 50"
    )
    .all(user.id) as LinkRow[]).map((l) => ({
      id: String(l.id), token: String(l.token), event_title: String(l.event_title), event_slug: String(l.event_slug),
      expires_at: l.expires_at ? String(l.expires_at) : null, used_at: l.used_at ? String(l.used_at) : null, created_at: String(l.created_at),
    }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Scheduling</h1>
          <p className="mt-1 text-[13.5px] text-muted">Manage your event types and share your booking links.</p>
        </div>
      </div>

      {sp.link_error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">Pick an event type to create a link.</div>
      )}

      <EventTypesBoard events={events} links={links} username={user.username} plan={user.plan} justCreated={sp.link_created} />

      <div className="mt-6 rounded-xl border border-line bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Your landing page</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <a href={"/" + user.username} className="text-[15px] font-medium text-brand hover:underline">calcal.app/{user.username}</a>
        </div>
        <p className="mt-1 text-[12.5px] text-muted">Share this page so people can pick an event type and book time with you.</p>
      </div>
    </div>
  );
}