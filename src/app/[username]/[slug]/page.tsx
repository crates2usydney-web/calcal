import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
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

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
      <path d="M12 21s6.5-5.4 6.5-10a6.5 6.5 0 1 0-13 0C5.5 15.6 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5S14.4 18.2 12 20.5C9.6 18.2 8.4 15.3 8.4 12S9.6 5.8 12 3.5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
      <rect x="3" y="6.5" width="12.5" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m15.5 11 4.5-2.6v7.2L15.5 13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ month?: string; day?: string; slot?: string; error?: string; name?: string; email?: string; notes?: string }>;
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
  const shortDay = (iso: string) => {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  };
  const base = "/" + row.host_username + "/" + row.slug;
  const prefill = new URLSearchParams();
  if (sp.name) prefill.set("name", sp.name);
  if (sp.email) prefill.set("email", sp.email);
  if (sp.notes) prefill.set("notes", sp.notes);
  const prefillQs = prefill.toString() ? "&" + prefill.toString() : "";

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-line bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo size={24} />
          <span className="text-[12.5px] text-muted">Scheduling by calcal</span>
        </div>
      </header>

      <main className="container-x max-w-[1080px] py-8 md:py-12">
        <Link href={"/" + row.host_username} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
          <span aria-hidden>←</span> {row.host_name}
        </Link>

        <div className="overflow-hidden rounded-xl border border-line bg-white md:grid md:grid-cols-[380px_1fr]">
          <aside className="border-b border-line p-7 md:border-b-0 md:border-r md:p-9">
            <div className="flex -space-x-2">
              {hosts.slice(0, 4).map((h, i) => (
                <span
                  key={h.id}
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-brand-soft text-[13px] font-semibold text-brand"
                  style={{ zIndex: 10 - i }}
                >
                  {h.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[13px] font-medium text-muted">{isRoundRobin ? hosts.length + " hosts · Team scheduling" : row.host_name}</p>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.02em]">{row.title}</h1>

            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2.5 text-[13px] text-muted"><ClockIcon /> {row.duration} min</p>
              {row.location && <p className="flex items-center gap-2.5 text-[13px] text-muted"><VideoIcon /> {row.location}</p>}
              <p className="flex items-center gap-2.5 text-[13px] text-muted"><GlobeIcon /> {tz}</p>
            </div>

            {row.description && <p className="mt-5 text-[13.5px] leading-relaxed text-muted">{row.description}</p>}

            {isRoundRobin && (
              <p className="mt-5 rounded-lg bg-brand-soft px-3 py-2.5 text-[12px] leading-relaxed text-brand">
                One of {hosts.length} hosts will be assigned when you book.
              </p>
            )}

            <div className="mt-6 border-t border-line pt-5">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted"><GlobeIcon /> Time zone</p>
              <p className="mt-1.5 text-[13px] text-ink/85">{tz}</p>
            </div>
          </aside>

          <section className="p-6 sm:p-8 md:p-9">
            {selectedSlot ? (
              <div>
                <div className="flex items-center justify-between">
                  <Link href={base + "?month=" + month + "&day=" + selectedDay + prefillQs} className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
                    <span aria-hidden>←</span> Back
                  </Link>
                  <p className="text-[13px] text-muted">{shortDay(selectedDay!)}</p>
                </div>

                <h2 className="mt-6 text-center text-[20px] font-semibold">Enter details</h2>
                <p className="mt-1 text-center text-[13px] text-muted">
                  {selectedSlot.label} – {new Date(selectedSlot.endISO).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })}
                </p>
                {isRoundRobin && <p className="mt-1 text-center text-[12px] text-brand">A host will be assigned automatically.</p>}
                {sp.error === "slot" && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">That time was just taken. Please pick another slot.</p>
                )}

                <form action={createBookingAction} className="mx-auto mt-6 max-w-[420px] space-y-4">
                  <input type="hidden" name="eventTypeId" value={row.id} />
                  <input type="hidden" name="startISO" value={selectedSlot.startISO} />
                  <div>
                    <label className="label">Name <span className="text-brand">*</span></label>
                    <input name="name" required defaultValue={sp.name ?? ""} className="input" />
                  </div>
                  <div>
                    <label className="label">Email <span className="text-brand">*</span></label>
                    <input name="email" type="email" required defaultValue={sp.email ?? ""} className="input" />
                  </div>
                  <div>
                    <label className="label">Please share anything that will help prepare for our meeting.</label>
                    <textarea name="notes" rows={3} defaultValue={sp.notes ?? ""} className="input resize-none" />
                  </div>
                  <button className="w-full rounded-lg bg-brand py-3 text-[14px] font-semibold text-white transition hover:bg-brand-dark">Schedule event</button>
                  <p className="text-center text-[11.5px] leading-relaxed text-muted">
                    By proceeding you agree to calcal&apos;s terms and privacy notice.
                  </p>
                </form>
              </div>
            ) : selectedDay ? (
              <div>
                <div className="flex items-start justify-between">
                  <Link href={base + "?month=" + month + prefillQs} className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
                    <span aria-hidden>←</span> Back
                  </Link>
                  <div className="text-right">
                    <p className="text-[15px] font-semibold">{dayLabel(selectedDay)}</p>
                    <p className="text-[12px] text-muted">{tz}</p>
                  </div>
                </div>

                <h2 className="mt-8 text-center text-[16px] font-semibold">Select a time</h2>
                <div className="mx-auto mt-4 grid max-h-[420px] max-w-[420px] gap-2 overflow-y-auto pr-1 scrollbar-thin">
                  {slots.map((s) => (
                    <Link
                      key={s.startISO}
                      href={base + "?month=" + month + "&day=" + selectedDay + "&slot=" + encodeURIComponent(s.startISO) + prefillQs}
                      className="rounded-lg border border-brand/50 bg-white py-2.5 text-center text-[13.5px] font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                    >
                      {s.label}
                    </Link>
                  ))}
                  {slots.length === 0 && <p className="py-8 text-center text-[13px] text-muted">No times available.</p>}
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-5 text-center text-[16px] font-semibold">Select a Date &amp; Time</p>
                <div className="flex items-center justify-between">
                  <Link
                    href={base + "?month=" + shiftMonth(month, -1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-cloud"
                    aria-label="Previous month"
                  >
                    ‹
                  </Link>
                  <p className="text-[16px] font-semibold">{MONTHS[monthNum - 1]} {year}</p>
                  <Link
                    href={base + "?month=" + shiftMonth(month, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-cloud"
                    aria-label="Next month"
                  >
                    ›
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-1 text-center">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                    <div key={d} className="pb-2 text-[10.5px] font-semibold tracking-wide text-muted">{d}</div>
                  ))}
                  {Array.from({ length: firstWeekday }).map((_, i) => <div key={"b" + i} />)}
                  {days.map((d) => (
                    d.hasSlots ? (
                      <Link
                        key={d.iso}
                        href={base + "?month=" + month + "&day=" + d.iso + prefillQs}
                        className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand transition hover:bg-brand hover:text-white"
                      >
                        {d.num}
                      </Link>
                    ) : (
                      <div key={d.iso} className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[13px] text-[#b9c7d8]">{d.num}</div>
                    )
                  ))}
                </div>

                <p className="mt-8 text-center text-[12px] text-muted">All times shown in {tz}</p>
              </div>
            )}
          </section>
        </div>

        <p className="mt-5 text-center text-[12px] text-muted">
          Powered by <Link href="/" className="font-semibold text-ink hover:text-brand">calcal</Link>
        </p>
      </main>
    </div>
  );
}