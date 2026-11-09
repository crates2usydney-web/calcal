"use client";

import { useState } from "react";
import { saveScheduleAction } from "@/lib/actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function options(selected: string) {
  const out: { value: string; label: string }[] = [];
  for (let m = 0; m < 24 * 60; m += 30) {
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const value = h + ":" + mm;
    const label = (Math.floor(m / 60) % 12 || 12) + ":" + mm + (m < 720 ? "am" : "pm");
    out.push({ value, label });
  }
  if (!out.some((o) => o.value === selected)) out.push({ value: selected, label: selected });
  return out;
}

type Day = { enabled: boolean; start: string; end: string };

export function AvailabilityEditor({ initial, timezone }: { initial: Day[]; timezone: string }) {
  const [days, setDays] = useState<Day[]>(initial);
  const [dirty, setDirty] = useState(false);

  function update(i: number, patch: Partial<Day>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    setDirty(true);
  }

  function copyMonday() {
    const mon = days[1];
    setDays((prev) => prev.map((d, i) => (i >= 1 && i <= 5 ? { ...mon } : d)));
    setDirty(true);
  }

  return (
    <form action={saveScheduleAction}>
      <input type="hidden" name="schedule" value={JSON.stringify(days.map((d, i) => ({ d: i, ...d })))} />

      <div className="rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div>
            <p className="text-[14px] font-semibold">Weekly hours</p>
            <p className="text-[12.5px] text-muted">Times are in {timezone}. Event types use these hours.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyMonday} className="btn btn-outline">Copy Monday to weekdays</button>
            <button className="btn btn-primary" disabled={!dirty}>Save changes</button>
          </div>
        </div>

        <div className="divide-y divide-line">
          {DAYS.map((day, i) => (
            <div key={day} className="flex flex-wrap items-center gap-4 px-6 py-4">
              <label className="flex w-[150px] items-center gap-3">
                <button
                  type="button"
                  onClick={() => update(i, { enabled: !days[i].enabled })}
                  className={"relative h-6 w-11 rounded-full transition " + (days[i].enabled ? "bg-brand" : "bg-[#cfd9e6]")}
                  aria-pressed={days[i].enabled}
                >
                  <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (days[i].enabled ? "left-[22px]" : "left-0.5")} />
                </button>
                <span className="text-[13.5px] font-medium">{day}</span>
              </label>

              {days[i].enabled ? (
                <div className="flex items-center gap-2">
                  <select value={days[i].start} onChange={(e) => update(i, { start: e.target.value })} className="rounded-lg border border-line px-3 py-1.5 text-[13px]">
                    {options(days[i].start).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span className="text-muted">–</span>
                  <select value={days[i].end} onChange={(e) => update(i, { end: e.target.value })} className="rounded-lg border border-line px-3 py-1.5 text-[13px]">
                    {options(days[i].end).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {days[i].end <= days[i].start && <span className="text-[12px] text-red-600">End must be after start</span>}
                </div>
              ) : (
                <span className="text-[13px] text-muted">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12.5px] text-muted">
        Bookings outside these hours are blocked. Buffers and minimum notice are configured per event type.
      </p>
    </form>
  );
}
