import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveAvailabilityAction } from "@/lib/actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function timeOptions(selected: number) {
  const out = [];
  for (let m = 0; m < 24 * 60; m += 30) {
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push({ value: h + ":" + mm, label: (Math.floor(m / 60) % 12 || 12) + ":" + mm + (m < 720 ? "am" : "pm"), selected: m === selected });
  }
  return out;
}

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { saved } = await searchParams;
  const rows = db
    .prepare("SELECT weekday, start_min, end_min FROM availability WHERE user_id = ? ORDER BY weekday")
    .all(user.id) as { weekday: number; start_min: number; end_min: number }[];

  return (
    <div className="max-w-3xl">
      <h1 className="text-[26px] font-semibold tracking-tight">Availability</h1>
      <p className="mt-1 text-[14px] text-muted">Set the hours you are typically available. Event types use these working hours.</p>
      {saved && <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-800">Availability saved.</div>}

      <form action={saveAvailabilityAction} className="mt-6 rounded-2xl border border-line bg-white p-6">
        <div className="mb-5 flex items-center gap-2 text-[13px] text-muted">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-mist text-[11px] text-brand">⟳</span>
          Timezone: {user.timezone}
        </div>
        <div className="space-y-3">
          {DAYS.map((day, d) => {
            const row = rows.find((r) => r.weekday === d);
            const enabled = !!row;
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-4 py-3">
                <label className="flex w-40 items-center gap-3">
                  <input type="checkbox" name={"day_" + d + "_enabled"} defaultChecked={enabled} className="h-4 w-4 accent-[#0069ff]" />
                  <span className="text-[14px] font-medium">{day}</span>
                </label>
                {enabled ? (
                  <div className="flex items-center gap-2">
                    <select name={"day_" + d + "_start"} defaultValue={String(Math.floor(row.start_min / 60)).padStart(2, "0") + ":" + String(row.start_min % 60).padStart(2, "0")}
                      className="rounded-lg border border-line px-3 py-1.5 text-[13px]">
                      {timeOptions(row.start_min).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span className="text-muted">–</span>
                    <select name={"day_" + d + "_end"} defaultValue={String(Math.floor(row.end_min / 60)).padStart(2, "0") + ":" + String(row.end_min % 60).padStart(2, "0")}
                      className="rounded-lg border border-line px-3 py-1.5 text-[13px]">
                      {timeOptions(row.end_min).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ) : (
                  <span className="text-[13px] text-muted">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <button className="rounded-lg bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-soft">Save changes</button>
        </div>
      </form>
    </div>
  );
}
