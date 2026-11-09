import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Notice } from "@/components/PageHeader";
import { bookPollWinnerAction } from "@/lib/actions";

type Option = { id: string; start_utc: string; position: number; votes: number };
type Voter = { option_id: string; name: string; email: string; created_at: string };

export default async function PollDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const poll = db
    .prepare(
      "SELECT p.id, p.token, p.title, p.description, p.duration, p.booked_option_id, p.booked_booking_id, e.title AS event_title, u.timezone " +
      "FROM polls p JOIN users u ON u.id = p.user_id LEFT JOIN event_types e ON e.id = p.event_type_id WHERE p.id = ? AND p.user_id = ?"
    )
    .get(id, user.id) as
    | { id: string; token: string; title: string; description: string; duration: number; booked_option_id: string | null; booked_booking_id: string | null; event_title: string | null; timezone: string }
    | undefined;
  if (!poll) notFound();

  const options = db
    .prepare("SELECT o.id, o.start_utc, o.position, (SELECT COUNT(*) FROM poll_votes v WHERE v.option_id = o.id) AS votes FROM poll_options o WHERE o.poll_id = ? ORDER BY o.position, o.start_utc")
    .all(poll.id) as Option[];
  const voters = db.prepare("SELECT option_id, name, email, created_at FROM poll_votes WHERE poll_id = ? ORDER BY created_at").all(poll.id) as Voter[];

  const label = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: poll.timezone });
  const maxVotes = Math.max(1, ...options.map((o) => o.votes));
  const uniqueVoters = new Set(voters.map((v) => v.email)).size;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/polls" className="text-[13px] font-medium text-muted hover:text-ink">‹ Meeting polls</Link>
      <div className="mt-3">
        <PageHeader title={poll.title} subtitle={(poll.event_title ? poll.event_title + " · " : "") + poll.duration + " min · " + uniqueVoters + " responses · times in " + poll.timezone}>
          <a href={"/p/" + poll.token} className="btn btn-outline">Open public page</a>
        </PageHeader>
      </div>

      {sp.error === "slot" && <Notice kind="error">That time is no longer available. Pick another option.</Notice>}
      {sp.error === "event" && <Notice kind="error">This poll has no event type. Edit it or create a new poll.</Notice>}
      {sp.error === "nooptions" && <Notice kind="error">This poll has no options.</Notice>}

      {poll.booked_booking_id ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <div>
            <p className="text-[13.5px] font-semibold text-green-900">Winner booked</p>
            <p className="text-[12.5px] text-green-800">A calendar booking was created from this poll.</p>
          </div>
          <Link href={"/booking/" + poll.booked_booking_id} className="btn btn-navy">View booking</Link>
        </div>
      ) : (
        <Notice kind="info">Pick any time to book it with the latest voter for that slot. The poll is marked booked afterwards.</Notice>
      )}

      <div className="mt-5 space-y-3">
        {options.map((o) => {
          const optionVoters = voters.filter((v) => v.option_id === o.id);
          const isBooked = poll.booked_option_id === o.id;
          return (
            <div key={o.id} className={"rounded-xl border bg-white p-5 " + (isBooked ? "border-green-300" : "border-line")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[14.5px] font-semibold">{label(o.start_utc)}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted">{o.votes} vote{o.votes === 1 ? "" : "s"} · {optionVoters.length} response{optionVoters.length === 1 ? "" : "s"}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {optionVoters.map((v, i) => (
                      <span key={i} className="rounded-full bg-cloud px-2 py-0.5 text-[11.5px] text-ink/80">{v.name}</span>
                    ))}
                    {!optionVoters.length && <span className="text-[12px] text-muted">No votes yet</span>}
                  </div>
                </div>
                {poll.booked_booking_id ? (
                  isBooked ? <span className="rounded-full bg-green-50 px-3 py-1 text-[11.5px] font-semibold text-green-700">Booked</span> : null
                ) : (
                  <form action={bookPollWinnerAction}>
                    <input type="hidden" name="poll_id" value={poll.id} />
                    <input type="hidden" name="option_id" value={o.id} />
                    <button className={"rounded-full px-4 py-2 text-[12.5px] font-semibold " + (o.votes === maxVotes && o.votes > 0 ? "bg-brand text-white hover:bg-brand-dark" : "border border-line text-ink hover:border-ink/30")}>
                      {o.votes === maxVotes && o.votes > 0 ? "Book winning time" : "Book this time"}
                    </button>
                  </form>
                )}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cloud">
                <div className="h-full rounded-full bg-brand" style={{ width: Math.round((o.votes / maxVotes) * 100) + "%" }} />
              </div>
            </div>
          );
        })}
      </div>

      {poll.description && <p className="mt-5 text-[13px] text-muted">{poll.description}</p>}
    </div>
  );
}
