import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CopyButton } from "@/components/CopyButton";
import { PageHeader, Notice } from "@/components/PageHeader";
import { PollComposer } from "@/components/PollComposer";
import { deletePollAction } from "@/lib/actions";

type Poll = { id: string; token: string; title: string; description: string; duration: number; created_at: string; options: number; votes: number; voters: number };

export default async function PollsPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const sp = await searchParams;

  const polls = db
    .prepare(
      "SELECT p.id, p.token, p.title, p.description, p.duration, p.created_at, " +
      "(SELECT COUNT(*) FROM poll_options o WHERE o.poll_id = p.id) AS options, " +
      "(SELECT COUNT(*) FROM poll_votes v WHERE v.poll_id = p.id) AS votes, " +
      "(SELECT COUNT(DISTINCT v.email) FROM poll_votes v WHERE v.poll_id = p.id) AS voters " +
      "FROM polls p WHERE p.user_id = ? ORDER BY p.created_at DESC"
    )
    .all(user.id) as Poll[];

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="max-w-4xl">
      <PageHeader title="Meeting polls" subtitle="Find a time that works for a group. Share a link, collect votes, then book the winner.">
        <Link href="/dashboard" className="btn btn-outline">Back to scheduling</Link>
      </PageHeader>

      {sp.error === "options" && <Notice kind="error">Add at least two different times to create a poll.</Notice>}
      {sp.created && <Notice>Poll created. Share <span className="font-mono">/p/{sp.created}</span> and watch the votes come in.</Notice>}

      <div className="mt-6">
        <PollComposer />
      </div>

      <div className="mt-6 space-y-3">
        {polls.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <p className="text-[15px] font-semibold">No polls yet</p>
            <p className="mt-1 text-[13px] text-muted">Create one above to coordinate a time with several people.</p>
          </div>
        )}
        {polls.map((p) => (
          <div key={p.id} className="rounded-xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[15.5px] font-semibold">{p.title}</p>
                {p.description && <p className="mt-0.5 text-[12.5px] text-muted">{p.description}</p>}
                <p className="mt-1 text-[12.5px] text-muted">
                  {p.options} times · {p.duration} min · {p.voters} {p.voters === 1 ? "response" : "responses"} ({p.votes} votes) · created {fmt(p.created_at)}
                </p>
                <p className="mt-1 font-mono text-[12px] text-brand/80">calcal.app/p/{p.token}</p>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton path={"/p/" + p.token} />
                <a href={"/p/" + p.token} className="btn btn-outline">Open</a>
                <form action={deletePollAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-muted hover:border-red-200 hover:text-red-600">Delete</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
