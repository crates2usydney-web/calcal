import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { db } from "@/lib/db";

export default async function SingleUseLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = db
    .prepare(
      "SELECT l.id, l.used_at, l.expires_at, e.slug, u.username " +
      "FROM single_use_links l JOIN event_types e ON e.id = l.event_type_id JOIN users u ON u.id = l.user_id " +
      "WHERE l.token = ?"
    )
    .get(token) as { id: string; used_at: string | null; expires_at: string | null; slug: string; username: string } | undefined;

  if (!row) notFound();

  const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
  const used = !!row.used_at;

  if (!used && !expired) {
    db.prepare("UPDATE single_use_links SET used_at = ? WHERE id = ?").run(new Date().toISOString(), row.id);
    redirect("/" + row.username + "/" + row.slug);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-line bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo size={24} />
          <span className="text-[12.5px] text-muted">Scheduling by calcal</span>
        </div>
      </header>
      <main className="container-x flex max-w-[560px] flex-col items-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f4f8] text-[22px]">🔒</div>
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">{used ? "This link has already been used" : "This link has expired"}</h1>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
          Single-use links can only be booked once. Ask {row.username} for a fresh link, or use their public booking page.
        </p>
        <Link href={"/" + row.username} className="btn btn-primary mt-6">Go to booking page</Link>
      </main>
    </div>
  );
}
