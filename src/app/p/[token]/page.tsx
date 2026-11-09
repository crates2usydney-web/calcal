import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { db } from "@/lib/db";
import { votePollAction } from "@/lib/actions";

type Option = { id: string; start_utc: string; position: number; votes: number };

export default async function PollPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ voted?: string; error?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const poll = db
    .prepare("SELECT p.id, p.title, p.description, p.duration, p.created_at, p.booked_booking_id, p.booked_option_id, u.name AS host_name, u.timezone FROM polls p JOIN users u ON u.id = p.user_id WHERE p.token = ?")
    .get(token) as { id: string; title: string; description: string; duration: number; created_at: string; booked_booking_id: string | null; booked_option_id: string | null;
    host_name: string; timezone: string } | undefined;
  if (!poll) notFound();

  const options = db
    .prepare(
      "SELECT o.id, o.start_utc, o.position, (SELECT COUNT(*) FROM poll_votes v WHERE v.option_id = o.id) AS votes " +
      "FROM poll_options o WHERE o.poll_id = ? ORDER BY o.position, o.start_utc"
    )
    .all(poll.id) as Option[];

  const voted = sp.voted === "1";
  const totalVoters = (db.prepare("SELECT COUNT(DISTINCT email) AS n FROM poll_votes WHERE poll_id = ?").get(poll.id) as { n: number }).n;
  const maxVotes = Math.max(1, ...options.map((o) => o.votes));

  const label = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: poll.timezone });

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-line bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo size={24} />
          <span className="text-[12.5px] text-muted">Scheduling by calcal</span>
        </div>
      </header>

      <main className="container-x max-w-[760px] py-10">
        <div className="rounded-2xl border border-line bg-white p-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand">Meeting poll</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em]">{poll.title}</h1>
          <p className="mt-1 text-[13.5px] text-muted">
            {poll.duration} min with {poll.host_name} · times shown in {poll.timezone}
          </p>
          {poll.description && <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{poll.description}</p>}

          {poll.booked_booking_id ? (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-[13.5px] text-green-800">
              <p className="font-semibold">This poll has been scheduled.</p>
              <p className="mt-1">The host booked a final time{poll.booked_option_id ? " from the options below" : ""}. Thanks for voting!</p>
            </div>
          ) : voted ? (
            <div className="mt-8">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[13.5px] text-green-800">
                Thanks — your availability was recorded. {totalVoters} {totalVoters === 1 ? "person has" : "people have"} responded.
              </div>
              <h2 className="mt-6 text-[14px] font-semibold">Results so far</h2>
              <div className="mt-3 space-y-2">
                {options.map((o) => (
                  <div key={o.id} className="rounded-lg border border-line p-3">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium">{label(o.start_utc)}</span>
                      <span className="text-muted">{o.votes} vote{o.votes === 1 ? "" : "s"}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cloud">
                      <div className="h-full rounded-full bg-brand" style={{ width: Math.round((o.votes / maxVotes) * 100) + "%" }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link href={"/p/" + token} className="mt-6 inline-block text-[13px] font-semibold text-brand">Submit another response</Link>
            </div>
          ) : (
            <form action={votePollAction} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <h2 className="text-[14px] font-semibold">Which times work for you?</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">Select every option you could attend.</p>
              <div className="mt-3 space-y-2">
                {options.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 text-[13.5px] hover:border-brand/50">
                    <input type="checkbox" name="option" value={o.id} className="h-4 w-4 accent-[#0069ff]" />
                    <span className="font-medium">{label(o.start_utc)}</span>
                  </label>
                ))}
              </div>

              {sp.error === "missing" && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">Add your name and email so the host knows who voted.</p>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Your name</label>
                  <input name="name" required className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input name="email" type="email" required className="input" />
                </div>
              </div>
              <button className="btn btn-primary mt-5 w-full">Submit availability</button>
            </form>
          )}
        </div>
        <p className="mt-5 text-center text-[12px] text-muted">Powered by <Link href="/" className="font-semibold text-ink">calcal</Link></p>
      </main>
    </div>
  );
}