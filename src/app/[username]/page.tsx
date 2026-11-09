import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="min-h-screen bg-mist/40 px-4 py-10">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl bg-white card-shadow md:grid-cols-[300px_1fr]">
        <div className="border-b border-line p-8 md:border-b-0 md:border-r">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-[20px] font-semibold text-brand">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <h1 className="mt-4 text-[22px] font-semibold tracking-tight">{user.name}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{user.welcome_message}</p>
          <p className="mt-6 text-[12px] uppercase tracking-wide text-muted/70">Timezone</p>
          <p className="text-[13px] text-navy/80">{user.timezone}</p>
        </div>

        <div className="p-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Select an event type</h2>
          <div className="mt-4 divide-y divide-line rounded-xl border border-line">
            {events.length === 0 && <p className="p-6 text-[14px] text-muted">No event types available yet.</p>}
            {events.map((e) => (
              <Link key={e.id} href={"/" + user.username + "/" + e.slug} className="flex items-center justify-between gap-4 p-5 hover:bg-mist/40">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
                  <div>
                    <p className="text-[15px] font-semibold">{e.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">{e.duration} min · {e.location || "No location set"} · {e.assignment === "round_robin" ? "Round robin" : "One-on-One"}</p>
                  </div>
                </div>
                <span className="text-[18px] text-navy/40">›</span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-muted">Powered by <span className="font-semibold text-navy">calcal</span></p>
        </div>
      </div>
    </div>
  );
}