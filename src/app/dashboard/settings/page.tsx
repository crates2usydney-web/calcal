import { getCurrentUser } from "@/lib/auth";
import { updateProfileAction } from "@/lib/actions";
import { CopyButton } from "@/components/CopyButton";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { saved } = await searchParams;

  return (
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-[14px] text-muted">Your profile and public booking page.</p>
      {saved && <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-800">Profile saved.</div>}

      <form action={updateProfileAction} className="mt-6 space-y-5 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-[20px] font-semibold text-brand">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-[14px] font-medium">Profile picture</p>
            <p className="text-[12.5px] text-muted">Initials are used as your avatar.</p>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Name</label>
          <input name="name" defaultValue={user.name} className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Username</label>
          <div className="flex items-center rounded-lg border border-line px-3.5">
            <span className="text-[13px] text-muted">calcal.app/</span>
            <input name="username" defaultValue={user.username} className="w-full bg-transparent py-2.5 text-[14px] outline-none" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Welcome message</label>
          <textarea name="welcome_message" rows={3} defaultValue={user.welcome_message}
            className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand" />
        </div>
        <div className="flex justify-end">
          <button className="rounded-lg bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-soft">Save changes</button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Your link</p>
          <p className="mt-1 text-[15px] font-medium text-brand">calcal.app/{user.username}</p>
        </div>
        <CopyButton path={"/" + user.username} />
      </div>
    </div>
  );
}
