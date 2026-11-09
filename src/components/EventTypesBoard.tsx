"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import {
  toggleEventTypeAction,
  duplicateEventTypeAction,
  createSingleUseLinkAction,
  revokeSingleUseLinkAction,
} from "@/lib/actions";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  duration: number;
  location: string;
  color: string;
  active: number;
  assignment: string;
};

type LinkRow = {
  id: string;
  token: string;
  event_title: string;
  event_slug: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
};

export function EventTypesBoard({
  events,
  links,
  username,
  plan,
  justCreated,
}: {
  events: EventRow[];
  links: LinkRow[];
  username: string;
  plan: string;
  justCreated?: string;
}) {
  const [tab, setTab] = useState<"types" | "links">(justCreated ? "links" : "types");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => (e.title + " " + e.location + " " + e.slug).toLowerCase().includes(q));
  }, [events, query]);

  return (
    <div>
      <div className="mt-6 flex items-center gap-6 border-b border-line text-[13.5px] font-medium">
        <button
          onClick={() => setTab("types")}
          className={"pb-3 " + (tab === "types" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink")}
        >
          Event types
        </button>
        <button
          onClick={() => setTab("links")}
          className={"pb-3 " + (tab === "links" ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink")}
        >
          Single-use links
        </button>
        <span className="ml-auto hidden pb-3 text-[12px] text-muted sm:block">
          {events.length} event type{events.length === 1 ? "" : "s"} · {plan} plan
        </span>
      </div>

      {tab === "types" && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-line bg-white px-3.5 py-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="m16.5 16.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search event types"
                className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted/70"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[12px] text-muted hover:text-ink">Clear</button>
              )}
            </div>
            <Link href="/dashboard/event-types/new" className="btn btn-primary">+ New event type</Link>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-14 text-center">
              <p className="text-[16px] font-semibold">{events.length ? "No matches" : "No event types yet"}</p>
              <p className="mt-1 text-[13.5px] text-muted">
                {events.length ? "Try a different search term." : "Create your first event type to start accepting bookings."}
              </p>
              {!events.length && <Link href="/dashboard/event-types/new" className="btn btn-primary mt-5">Create event type</Link>}
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {filtered.map((e) => (
                <div key={e.id} className="group flex items-stretch overflow-hidden rounded-xl border border-line bg-white transition hover:shadow-[0_10px_28px_rgba(11,53,88,0.08)]">
                  <div className="w-1.5 shrink-0" style={{ background: e.color }} />
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={"/dashboard/event-types/" + e.id} className="truncate text-[15.5px] font-semibold hover:text-brand">{e.title}</Link>
                        {!e.active && <span className="rounded bg-[#f1f4f8] px-2 py-0.5 text-[11px] font-medium text-muted">Hidden</span>}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: e.color }} />
                        {e.duration} min <span className="text-line">•</span> {e.location || "No location set"}{" "}
                        <span className="text-line">•</span> {e.assignment === "round_robin" ? "Round robin" : "One-on-One"}
                      </p>
                      <p className="mt-1 truncate text-[12px] text-brand/80">calcal.app/{username}/{e.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={toggleEventTypeAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="active" value={e.active ? "0" : "1"} />
                        <button
                          type="submit"
                          aria-label={e.active ? "Hide event type" : "Show event type"}
                          className="flex items-center gap-2 rounded-full px-1 py-1"
                        >
                          <span className={"relative block h-6 w-11 rounded-full transition " + (e.active ? "bg-brand" : "bg-[#cfd9e6]")}>
                            <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (e.active ? "left-[22px]" : "left-0.5")} />
                          </span>
                          <span className={"text-[11.5px] font-medium " + (e.active ? "text-ink/70" : "text-muted")}>{e.active ? "On" : "Off"}</span>
                        </button>
                      </form>
                      <CopyButton path={"/" + username + "/" + e.slug} />
                      <Link href={"/dashboard/event-types/" + e.id} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-ink hover:border-ink/30">Edit</Link>
                      <form action={duplicateEventTypeAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/30 hover:text-ink" title="Duplicate">Duplicate</button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "links" && (
        <div className="mt-5">
          {justCreated && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
              Single-use link created: <span className="font-mono">/l/{justCreated}</span> — it can be booked once.
            </div>
          )}

          <div className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold">Create a single-use link</h2>
                <p className="mt-0.5 text-[12.5px] text-muted">Send a booking link that works only once, then expires.</p>
              </div>
              <button onClick={() => setCreating((v) => !v)} className="btn btn-outline">{creating ? "Cancel" : "+ New link"}</button>
            </div>
            {creating && (
              <form action={createSingleUseLinkAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                <div className="min-w-[220px] flex-1">
                  <label className="label">Event type</label>
                  <select name="event_type_id" className="input" required>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
                <div className="w-[140px]">
                  <label className="label">Expires in</label>
                  <select name="days" className="input" defaultValue="7">
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
                <button className="btn btn-primary" disabled={!events.length}>Create link</button>
              </form>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-cloud/60 text-[11.5px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {links.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No single-use links yet.</td></tr>
                )}
                {links.map((l) => {
                  const expired = l.expires_at ? new Date(l.expires_at).getTime() < Date.now() : false;
                  const status = l.used_at ? "Used" : expired ? "Expired" : "Active";
                  return (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink">/l/{l.token}</td>
                      <td className="px-4 py-3">{l.event_title}</td>
                      <td className="px-4 py-3">
                        <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (status === "Active" ? "bg-green-50 text-green-700" : "bg-[#f1f4f8] text-muted")}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CopyButton path={"/l/" + l.token} />
                          <form action={revokeSingleUseLinkAction}>
                            <input type="hidden" name="id" value={l.id} />
                            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-muted hover:border-red-200 hover:text-red-600">Revoke</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}