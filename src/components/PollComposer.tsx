"use client";

import { useState } from "react";
import { createPollAction } from "@/lib/actions";

type Row = { date: string; time: string };

function tomorrow(offset = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function PollComposer({ events }: { events: { id: string; title: string }[] }) {
  const [rows, setRows] = useState<Row[]>([
    { date: tomorrow(1), time: "09:00" },
    { date: tomorrow(1), time: "13:00" },
    { date: tomorrow(2), time: "10:00" },
  ]);

  function toISO(r: Row) {
    const d = new Date(r.date + "T" + r.time + ":00");
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const options = rows.map(toISO).filter(Boolean);

  return (
    <form action={createPollAction} className="rounded-2xl border border-line bg-white p-6">
      <h2 className="text-[15px] font-semibold">Create a meeting poll</h2>
      <p className="mt-0.5 text-[12.5px] text-muted">Offer several times and let invitees vote. When voting closes, book the winner in one click.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px_130px]">
        <div>
          <label className="label">Title</label>
          <input name="title" required placeholder="Board sync — November" className="input" />
        </div>
        <div>
          <label className="label">Event type</label>
          <select name="event_type_id" className="input" required>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Duration</label>
          <select name="duration" className="input" defaultValue="30">
            {[15, 30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="label">Description</label>
        <input name="description" placeholder="Optional note for invitees" className="input" />
      </div>

      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Candidate times</p>
      <div className="mt-2 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input type="date" value={r.date} onChange={(e) => setRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)))} className="rounded-lg border border-line px-3 py-2 text-[13px]" />
            <input type="time" value={r.time} onChange={(e) => setRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, time: e.target.value } : x)))} className="rounded-lg border border-line px-3 py-2 text-[13px]" />
            <button type="button" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-lg border border-line px-2.5 py-2 text-[12px] text-muted hover:border-red-200 hover:text-red-600">Remove</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setRows((prev) => [...prev, { date: tomorrow(2), time: "15:00" }])} className="mt-2 text-[12.5px] font-semibold text-brand">+ Add another time</button>

      <input type="hidden" name="options" value={JSON.stringify(options)} />

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[12px] text-muted">{options.length} time{options.length === 1 ? "" : "s"} selected</p>
        <button className="btn btn-primary" disabled={options.length < 2 || !events.length}>Create poll</button>
      </div>
    </form>
  );
}
