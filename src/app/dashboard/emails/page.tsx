import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runEmailsAction, testEmailAction } from "@/lib/actions";

type EmailRow = {
  id: string;
  to_email: string;
  subject: string;
  kind: string;
  status: string;
  send_at: string;
  sent_at: string | null;
  created_at: string;
};

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ ran?: string; test?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { ran, test } = await searchParams;
  const emails = db
    .prepare("SELECT id, to_email, subject, kind, status, send_at, sent_at, created_at FROM emails WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
    .all(user.id) as EmailRow[];

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "–";

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Emails</h1>
          <p className="mt-1 text-[14px] text-muted">
            Outbox for confirmations, reminders and cancellations. Connect Resend to deliver for real.
          </p>
        </div>
        <form action={runEmailsAction}>
          <button className="rounded-lg bg-navy px-4 py-2.5 text-[12.5px] font-semibold text-white">Run due emails</button>
        </form>
      </div>

      {ran && <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-800">Due emails processed.</div>}
      {test && <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-800">Test email queued and sent (dev transport).</div>}

      <form action={testEmailAction} className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-3">
        <input name="to" defaultValue={user.email} className="min-w-[240px] flex-1 rounded-lg border border-line px-3 py-2 text-[13px]" />
        <button className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium">Send test email</button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
        <div className="hidden grid-cols-[1fr_130px_90px_120px] gap-3 border-b border-line bg-mist/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted sm:grid">
          <span>Email</span><span>Status</span><span>Kind</span><span>Scheduled / sent</span>
        </div>
        {emails.length === 0 && <p className="p-6 text-[13.5px] text-muted">No emails yet. Book a meeting to generate one.</p>}
        {emails.map((e) => (
          <Link key={e.id} href={"/dashboard/emails/" + e.id} className="grid gap-1 border-b border-line/70 px-4 py-3 last:border-0 hover:bg-mist/30 sm:grid-cols-[1fr_130px_90px_120px] sm:items-center sm:gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium">{e.subject}</p>
              <p className="truncate text-[12px] text-muted">to {e.to_email}</p>
            </div>
            <span className={"w-fit rounded-full px-2 py-0.5 text-[11px] font-medium " + (e.status === "sent" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
              {e.status}
            </span>
            <span className="text-[12px] text-muted">{e.kind.replace("_", " ")}</span>
            <span className="text-[12px] text-muted">{fmt(e.sent_at ?? e.send_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
