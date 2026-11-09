import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { saved } = await searchParams;
  const rows = db
    .prepare("SELECT weekday, start_min, end_min FROM availability WHERE user_id = ? ORDER BY weekday")
    .all(user.id) as { weekday: number; start_min: number; end_min: number }[];

  const initial = Array.from({ length: 7 }, (_, d) => {
    const row = rows.find((r) => r.weekday === d);
    const toTime = (m: number) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
    return row
      ? { enabled: true, start: toTime(row.start_min), end: toTime(row.end_min) }
      : { enabled: false, start: "09:00", end: "17:00" };
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Availability</h1>
      <p className="mt-1 text-[13.5px] text-muted">Set the hours you are typically available. Event types use these working hours.</p>
      {saved && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">Availability saved.</div>}
      <div className="mt-6">
        <AvailabilityEditor initial={initial} timezone={user.timezone} />
      </div>
    </div>
  );
}
