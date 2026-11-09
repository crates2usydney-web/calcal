import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getEventHosts, unionSlotsForDay } from "@/lib/hosts";
import { ymdInTz } from "@/lib/time";
import { createBookingAction } from "@/lib/actions";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ month?: string; day?: string; slot?: string; error?: string }>;
}) {
  const { username, slug } = await params;
  const sp = await searchParams;

  const row = db
    .prepare(
      "SELECT e.*, u.name AS host_name, u.username AS host_username, u.timezone AS host_tz " +
      "FROM event_types e JOIN users u ON u.id = e.user_id " +
      "WHERE u.username = ? AND e.slug = ? AND e.active = 1"
    )
    .get(username.toLowerCase(), slug) as
    | {
        id: string; user_id: string; title: string; slug: string; description: string; duration: number;
        location: string; color: string; assignment: string; host_name: string; host_username: string; host_tz: string;
      }
    | undefined;
  if (!row) notFound();

  const hosts = getEventHosts(row.id, row.user_id, row.assignment);
  const isRoundRobin = row.assignment === "round_robin" && hosts.length > 1;
  const tz = row.host_tz;
  const todayISO = ymdInTz(new Date(), tz);
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : todayISO.slice(0, 7);
  const [year, monthNum] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNum - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const iso = month + "-" + String(i + 1).padStart(2, "0");
    const slots = iso >= todayISO ? unionSlotsForDay({ hosts, dayISO: iso, duration: row.duration, displayTz: tz }) : [];
    return { iso, num: i + 1, hasSlots: slots.length > 0 };
  });

  const selectedDay = sp.day && days.some((d) => d.iso === sp.day) ? sp.day : null;
  const slots = selectedDay ? unionSlotsForDay({ hosts, dayISO: selectedDay, duration: row.duration, displayTz: tz }) : [];
  const selectedSlot = sp.slot && slots.some((s) => s.startISO === sp.slot) ? slots.find((s) => s.startISO === sp.slot)! : null;

  const dayLabel = (iso: string) => {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  };

  return (
    <div className="min-h-screen bg-mist/40 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href={"/" + row.host_username} className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-navy">
          ‹ {row.host_name}
        </Link>
        <div className="grid overflow-hidden rounded-2xl bg-white card-shadow md:grid-cols-[320px_1fr]">
          <aside className="border-b border-line p-8 md:border-b-0 md:border-r">
            <div className="flex -space-x-2">
              {hosts.slice(0, 4).map((h, i) => (
                <span key={h.id} className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-brand/10 text-[13px] font-semibold text-brand" style={{ zIndex: 10 - i }}>
                  {h.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[14px] text-muted">{isRoundRobin ? "Team scheduling" : row.host_name}</p>
            <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-tight">{row.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">◷ {row.duration} min</p>
            {row.location && <p className="mt-1 flex items-center gap-2 text-[13px] text-muted">⌖ {row.location}</p>}
            {row.description && <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{row.description}</p>}
            {isRoundRobin && (
              <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-[12px] text-brand">
                Round robin · {hosts.length} hosts. We assign the first available host when you book.
              </p>
            )}
            <p className="mt-6 text-[12px] uppercase tracking-wide text-muted/70">Time zone</p>
            <p className="text-[13px] text-navy/80">{tz}</p>
          </aside>

          <section className="p-6 sm:p-8">
            {selectedSlot ? (
              <div>
                <div className="flex items-center justify-between">
                  <Link href={"/" + row.host_username + "/" + row.slug + "?month=" + month + "&day=" + selectedDay} className="text-[13px] text-muted">‹ Back</Link>
                  <p className="text-[13px] text-muted">{dayLabel(selectedDay!)}</p>
                </div>
                <h2 className="mt-4 text-center text-[20px] font-semibold">Enter details</h2>
                <p className="mt-1 text-center text-[13px] text-muted">
                  {selectedSlot.label} – {new Date(selectedSlot.endISO).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })}
                </p>
                {isRoundRobin && <p className="mt-1 text-center text-[12px] text-brand">A host will be assigned automatically.</p>}
                {sp.error === "slot" && (
                  <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">That time was just taken. Please pick another slot.</p>
                )}
                <form action={createBookingAction} className="mx-auto mt-6 max-w-md space-y-4">
                  <input type="hidden" name="eventTypeId" value={row.id} />
                  <input type="hidden" name="startISO" value={selectedSlot.startISO} />
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium">Name *</label>
                    <input name="name" required className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium">Email *</label>
                    <input name="email" type="email" required className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium">Please share anything that will help prepare for our meeting.</label>
                    <textarea name="notes" rows={3} className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
                  </div>
                  <button className="w-full rounded-lg bg-brand py-3 text-[14px] font-semibold text-white hover:bg-brand-dark">Schedule event</button>
                  <p className="text-center text-[11.5px] text-muted">By proceeding you agree to calcal's terms and privacy notice.</p>
                </form>
              </div>
            ) : selectedDay ? (
              <div>
                <div className="flex items-center justify-between">
                  <Link href={"/" + row.host_username + "/" + row.slug + "?month=" + month} className="text-[13px] font-medium text-muted hover:text-navy">‹ Back</Link>
                  <div className="text-right">
                    <p className="text-[15px] font-semibold">{dayLabel(selectedDay)}</p>
                    <p className="text-[12px] text-muted">{tz}</p>
                  </div>
                </div>
                <h2 className="mt-6 text-center text-[17px] font-semibold">Select a time</h2>
                <div className="mx-auto mt-4 grid max-h-[420px] max-w-md gap-2 overflow-y-auto pr-1">
                  {slots.map((s) => (
                    <Link
                      key={s.startISO}
                      href={"/" + row.host_username + "/" + row.slug + "?month=" + month + "&day=" + selectedDay + "&slot=" + encodeURIComponent(s.startISO)}
                      className="rounded-lg border border-brand/40 py-2.5 text-center text-[13.5px] font-medium text-brand hover:bg-brand hover:text-white"
                    >
                      {s.label}
                    </Link>
                  ))}
                  {slots.length === 0 && <p className="py-8 text-center text-[13px] text-muted">No times available.</p>}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <Link href={"/" + row.host_username + "/" + row.slug + "?month=" + shiftMonth(month, -1)} className="rounded-lg border border-line px-2.5 py-1.5 text-[14px] text-navy">‹</Link>
                  <p className="text-[15px] font-semibold">{MONTHS[monthNum - 1]} {year}</p>
                  <Link href={"/" + row.host_username + "/" + row.slug + "?month=" + shiftMonth(month, 1)} className="rounded-lg border border-line px-2.5 py-1.5 text-[14px] text-navy">›</Link>
                </div>
                <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11.5px] font-medium text-muted">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
                  {Array.from({ length: firstWeekday }).map((_, i) => <div key={"b" + i} />)}
                  {days.map((d) => (
                    d.hasSlots ? (
                      <Link key={d.iso} href={"/" + row.host_username + "/" + row.slug + "?month=" + month + "&day=" + d.iso}
                        className="rounded-full py-2 text-[13px] font-semibold text-brand hover:bg-brand hover:text-white">
                        {d.num}
                      </Link>
                    ) : (
                      <div key={d.iso} className="rounded-full py-2 text-[13px] text-navy/25">{d.num}</div>
                    )
                  ))}
                </div>
                <p className="mt-6 text-center text-[12px] text-muted">All times shown in {tz}</p>
              </div>
            )}
          </section>
        </div>
        <p className="mt-5 text-center text-[12px] text-muted">Powered by <span className="font-semibold text-navy">calcal</span></p>
      </div>
    </div>
  );
}
