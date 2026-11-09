import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventTypeForm } from "@/components/EventTypeForm";
import { CopyButton } from "@/components/CopyButton";
import { deleteEventTypeAction } from "@/lib/actions";
import { getTeamMembers } from "@/lib/hosts";

export default async function EditEventTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const e = db
    .prepare("SELECT * FROM event_types WHERE id = ? AND user_id = ?")
    .get(id, user.id) as
    | { id: string; title: string; slug: string; description: string; duration: number; location: string; color: string; assignment: string }
    | undefined;
  if (!e) notFound();
  const hostIds = (db.prepare("SELECT user_id FROM event_type_hosts WHERE event_type_id = ? ORDER BY position").all(id) as { user_id: string }[]).map((r) => r.user_id);
  const team = getTeamMembers(user.id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Edit event type</h1>
          <p className="mt-1 text-[14px] text-muted">Changes apply to your public booking page.</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton path={"/" + user.username + "/" + e.slug} />
          <Link href={"/" + user.username + "/" + e.slug} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium">
            Preview
          </Link>
        </div>
      </div>
      <EventTypeForm initial={{ ...e, hostIds }} team={team} plan={user.plan} />
      <form action={deleteEventTypeAction} className="mt-10 border-t border-line pt-5">
        <input type="hidden" name="id" value={e.id} />
        <button className="text-[13px] font-medium text-red-600 hover:underline">Delete event type</button>
      </form>
    </div>
  );
}
