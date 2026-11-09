import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { loginAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      <div className="hidden flex-col justify-between bg-ink p-10 text-white md:flex">
        <Logo light size={26} />
        <div className="max-w-md">
          <h2 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.02em]">Every meeting, starting on time.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Booking links, reminders and payments in one place. Log in to manage your schedule and your team.
          </p>
          <div className="mt-10 space-y-3">
            {["Share one link, get booked", "Calendar-aware availability", "Automatic reminders"].map((t) => (
              <div key={t} className="flex items-center gap-3 text-[13.5px] text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px]">✓</span>
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="text-[12px] text-white/40">© {new Date().getFullYear()} calcal</p>
      </div>

      <div className="flex flex-col bg-white">
        <div className="flex h-16 items-center px-6 md:hidden"><Logo size={24} /></div>
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Welcome back</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">Log in to manage your schedule.</p>
            {error && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">Email or password is incorrect.</p>
            )}
            <form action={loginAction} className="mt-6 space-y-4">
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" required placeholder="you@company.com" className="input" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label mb-0">Password</label>
                  <span className="text-[12px] font-medium text-brand">Forgot?</span>
                </div>
                <input name="password" type="password" required placeholder="••••••••" className="input" />
              </div>
              <button className="w-full rounded-lg bg-brand py-3 text-[14px] font-semibold text-white hover:bg-brand-dark">Log in</button>
            </form>
            <p className="mt-5 text-center text-[13px] text-muted">
              New to calcal? <Link href="/signup" className="font-semibold text-brand hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
