import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CopyButton } from "@/components/CopyButton";
import { updateSettingsAction } from "@/lib/actions";
import { db } from "@/lib/db";
import { providerStatuses } from "@/lib/provider-status";

function timezones(current: string) {
  let zones: string[] = [];
  try {
    zones = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    zones = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"];
  }
  if (!zones.includes(current)) zones = [current, ...zones];
  return zones;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { saved, error } = await searchParams;
  const zones = timezones(user.timezone);
  const providers = providerStatuses();
  const liveCount = providers.filter((p) => p.mode === "live").length;
  const googleConnRow = db
    .prepare("SELECT access_token FROM oauth_connections WHERE user_id = ? AND provider = 'google-calendar'")
    .get(user.id) as { access_token: string } | undefined;
  const googleConn = googleConnRow ? { mode: googleConnRow.access_token === "demo" ? "demo" : "live" } : null;
  const stripePaid = (db
    .prepare("SELECT COUNT(*) AS n FROM bookings b JOIN event_types e ON e.id = b.event_type_id WHERE e.user_id = ? AND b.payment_status = 'paid'")
    .get(user.id) as { n: number }).n;

  return (
    <div className="max-w-2xl">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Settings</h1>
      <p className="mt-1 text-[13.5px] text-muted">Your profile and public booking page.</p>

      {saved && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">Changes saved.</div>}
      {error === "username" && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">That username is already taken.</div>}
      {error === "password" && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">New password must be at least 6 characters.</div>}
      {error === "current" && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">Current password is incorrect.</div>}

      <form action={updateSettingsAction} className="mt-6 space-y-5 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-[20px] font-semibold text-brand">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-[14px] font-medium">Profile</p>
            <p className="text-[12.5px] text-muted">Initials are used as your avatar.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input name="name" defaultValue={user.name} className="input" />
          </div>
          <div>
            <label className="label">Username</label>
            <div className="flex items-center rounded-lg border border-line bg-white pl-3 focus-within:border-brand">
              <span className="text-[13px] text-muted">calcal.app/</span>
              <input name="username" defaultValue={user.username} className="w-full bg-transparent px-1 py-2.5 text-[14px] outline-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Time zone</label>
          <select name="timezone" defaultValue={user.timezone} className="input">
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <p className="mt-1 text-[12px] text-muted">Used for your availability grid, booking pages and reminders.</p>
        </div>

        <div>
          <label className="label">Welcome message</label>
          <textarea name="welcome_message" rows={3} defaultValue={user.welcome_message} className="input resize-none" />
          <p className="mt-1 text-[12px] text-muted">Shown at the top of your public booking page.</p>
        </div>

        <div className="border-t border-line pt-5">
          <p className="text-[14px] font-semibold">Change password</p>
          <p className="mt-0.5 text-[12.5px] text-muted">Leave blank to keep your current password.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Current password</label>
              <input name="current_password" type="password" className="input" autoComplete="current-password" />
            </div>
            <div>
              <label className="label">New password</label>
              <input name="new_password" type="password" minLength={6} className="input" autoComplete="new-password" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save changes</button>
        </div>
      </form>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Integration status</p>
            <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em]">Demo vs live</h2>
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-muted">
              What is actually configured on this server. Set the listed environment variables on your host and redeploy to switch a provider to live.
            </p>
          </div>
          <span className="rounded-full bg-cloud px-3 py-1 text-[11.5px] font-semibold text-ink/80">
            {liveCount} of {providers.length} live
          </span>
        </div>

        <div className="mt-5 divide-y divide-line">
          {providers.map((p) => {
            const badge =
              p.mode === "live"
                ? "bg-green-50 text-green-700"
                : p.mode === "demo"
                ? "bg-amber-50 text-amber-700"
                : "bg-[#f1f4f8] text-muted";
            return (
              <div key={p.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold">{p.name}</p>
                      <span className={"rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide " + badge}>
                        {p.mode === "live" ? "Live" : p.mode === "demo" ? "Demo" : "Off"}
                      </span>
                      {p.id === "google" && googleConn && (
                        <span className="rounded-full bg-cloud px-2 py-0.5 text-[10.5px] font-medium text-ink/70">
                          Account: {googleConn.mode === "demo" ? "demo connected" : "live connected"}
                        </span>
                      )}
                      {p.id === "stripe" && stripePaid > 0 && (
                        <span className="rounded-full bg-cloud px-2 py-0.5 text-[10.5px] font-medium text-ink/70">{stripePaid} paid booking{stripePaid === 1 ? "" : "s"}</span>
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted">{p.purpose}</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/75">{p.detail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {p.env.map((e) => (
                        <code key={e} className="rounded bg-cloud px-1.5 py-0.5 font-mono text-[10.5px] text-ink/70">{e}</code>
                      ))}
                    </div>
                  </div>
                  <Link href={p.manageHref} className="btn btn-outline shrink-0">{p.manageLabel}</Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 rounded-lg bg-cloud px-3 py-2 text-[11.5px] text-muted">
          Secret values are never displayed — this panel only reports whether each provider is configured.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Your link</p>
          <p className="mt-1 text-[15px] font-medium text-brand">calcal.app/{user.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton path={"/" + user.username} />
          <a href={"/" + user.username} className="btn btn-outline">Open page</a>
        </div>
      </div>
    </div>
  );
}