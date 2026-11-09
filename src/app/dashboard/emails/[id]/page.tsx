import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const e = db
    .prepare("SELECT * FROM emails WHERE id = ? AND user_id = ?")
    .get(id, user.id) as
    | { id: string; to_email: string; subject: string; body_html: string; body_text: string; status: string; kind: string; send_at: string; sent_at: string | null; last_error: string | null }
    | undefined;
  if (!e) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/emails" className="text-[13px] font-medium text-muted hover:text-navy">‹ Emails</Link>
      <h1 className="mt-3 text-[20px] font-semibold tracking-tight">{e.subject}</h1>
      <p className="mt-1 text-[13px] text-muted">
        To {e.to_email} · {e.kind} · <span className="uppercase">{e.status}</span>
        {e.last_error && <span className="text-red-600"> · {e.last_error}</span>}
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
        <iframe title="email" srcDoc={e.body_html} className="h-[640px] w-full" />
      </div>
      <details className="mt-4 rounded-xl border border-line bg-white p-4">
        <summary className="cursor-pointer text-[13px] font-medium">Plain text</summary>
        <pre className="mt-3 whitespace-pre-wrap text-[12.5px] text-muted">{e.body_text}</pre>
      </details>
    </div>
  );
}
