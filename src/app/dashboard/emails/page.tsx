import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runEmailsAction, testEmailAction } from "@/lib/actions";
import { PageHeader, Notice } from "@/components/PageHeader";

type EmailRow = {
  id: string; to_email: string; subject: string; kind: string; status: string; send_at: string; sent_at: string | null; created_at: string;
};

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ ran?: string; test?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { ran, test } = await searchParams;
  const emails = db
    .prepare("SELECT id, to_email, subject, kind, status, send_at, sent_at, created_at FROM emails WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
    .all(user.id) as EmailRow[];

  const pending = emails.filter((e) => e.status !== "sent").length;
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "–";

  return (
    <div className="max-w-4xl">
      <PageHeader title="Emails & reminders" subtitle="Confirmations, cancellations and reminders. Connect Resend to deliver for real; otherwise everything stays in the outbox.">
        <form action={runEmailsAction}>
          <button className="btn btn-primary">Run due emails</button>
        </form>
      </PageHeader>

      {ran && <Notice>Due emails processed.</Notice>}
      {test && <Notice>Test email queued and delivered through the dev transport.</Notice>}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Sent", emails.filter((e) => e.status === "sent").length],
          ["Pending", pending],
          ["Total", emails.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
            <p className="mt-1 text-[24px] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <form action={testEmailAction} className="mt-5 rounded-xl border border-line bg-white p-5">
        <h2 className="text-[14px] font-semibold">Send a test email</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input name="to" defaultValue={user.email} className="input min-w-[240px] flex-1" />
          <button className="btn btn-outline">Send test email</button>
        </div>
      </form>

      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white">
        <div className="hidden grid-cols-[1.6fr_110px_110px_150px] gap-3 border-b border-line bg-cloud/60 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted sm:grid">
          <span>Email</span><span>Status</span><span>Kind</span><span>Scheduled / sent</span>
        </div>
        {emails.length === 0 && <p className="p-6 text-[13.5px] text-muted">No emails yet. Book a meeting to generate one.</p>}
        {emails.map((e) => (
          <Link key={e.id} href={"/dashboard/emails/" + e.id} className="grid gap-1 border-b border-line/70 px-5 py-3.5 last:border-0 hover:bg-cloud/60 sm:grid-cols-[1.6fr_110px_110px_150px] sm:items-center sm:gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium">{e.subject}</p>
              <p className="truncate text-[12px] text-muted">to {e.to_email}</p>
            </div>
            <span className={"w-fit rounded-full px-2 py-0.5 text-[11px] font-medium " + (e.status === "sent" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>{e.status}</span>
            <span className="text-[12px] text-muted">{e.kind.replace(/_/g, " ")}</span>
            <span className="text-[12px] text-muted">{fmt(e.sent_at ?? e.send_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
