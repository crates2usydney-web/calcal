import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { db } from "@/lib/db";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = db
    .prepare("SELECT id, name, username, timezone, welcome_message FROM users WHERE username = ?")
    .get(username.toLowerCase()) as
    | { id: string; name: string; username: string; timezone: string; welcome_message: string }
    | undefined;
  if (!user) notFound();
  const events = db
    .prepare("SELECT id, title, slug, description, duration, location, color FROM event_types WHERE user_id = ? AND active = 1 ORDER BY created_at")
    .all(user.id) as { id: string; title: string; slug: string; description: string; duration: number; location: string; color: string; assignment: string }[];

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-line bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo size={24} />
          <Link href="/pricing" className="text-[12.5px] font-medium text-muted hover:text-ink">Create your own page</Link>
        </div>
      </header>

      <main className="container-x max-w-[980px] py-10">
        <div className="overflow-hidden rounded-xl border border-line bg-white md:grid md:grid-cols-[340px_1fr]">
          <aside className="border-b border-line p-8 md:border-b-0 md:border-r md:p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-[20px] font-semibold text-brand">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <h1 className="mt-4 text-[24px] font-semibold tracking-[-0.02em]">{user.name}</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{user.welcome_message}</p>
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">Time zone</p>
              <p className="mt-1 text-[13px] text-ink/85">{user.timezone}</p>
            </div>
          </aside>

          <section className="p-8 md:p-10">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Select an event type</h2>
            <div className="mt-4 divide-y divide-line rounded-xl border border-line">
              {events.length === 0 && <p className="p-6 text-[14px] text-muted">No event types available yet.</p>}
              {events.map((e) => (
                <Link key={e.id} href={"/" + user.username + "/" + e.slug} className="flex items-center justify-between gap-4 p-5 transition hover:bg-cloud">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
                    <div>
                      <p className="text-[15px] font-semibold">{e.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {e.duration} min · {e.location || "No location set"} · {e.assignment === "round_robin" ? "Round robin" : "One-on-One"}
                      </p>
                    </div>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-[13px] text-muted">›</span>
                </Link>
              ))}
            </div>

            <p className="mt-7 text-center text-[12px] text-muted">
              Powered by <Link href="/" className="font-semibold text-ink hover:text-brand">calcal</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
