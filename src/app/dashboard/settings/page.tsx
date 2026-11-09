import { getCurrentUser } from "@/lib/auth";
import { CopyButton } from "@/components/CopyButton";
import { updateSettingsAction } from "@/lib/actions";

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
