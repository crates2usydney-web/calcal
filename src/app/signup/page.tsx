import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { signupAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col bg-white">
        <div className="flex h-16 items-center px-6"><Logo size={24} /></div>
        <div className="flex flex-1 items-center justify-center px-5 py-8">
          <div className="w-full max-w-[420px]">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Create your account</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">Free forever. No credit card required.</p>
            {error === "exists" && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">An account with that email already exists.</p>
            )}
            {error === "missing" && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">Please fill all fields. Password needs 6+ characters.</p>
            )}
            <form action={signupAction} className="mt-6 space-y-3.5">
              <div>
                <label className="label">Full name</label>
                <input name="name" required placeholder="Alex Morgan" className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" required placeholder="you@company.com" className="input" />
              </div>
              <div>
                <label className="label">Username</label>
                <div className="flex items-center rounded-lg border border-line bg-white pl-3 focus-within:border-brand">
                  <span className="text-[13px] text-muted">calcal.app/</span>
                  <input name="username" placeholder="alex" className="w-full rounded-lg bg-transparent px-1 py-2.5 text-[14px] outline-none" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" required minLength={6} placeholder="At least 6 characters" className="input" />
              </div>
              <button className="w-full rounded-lg bg-brand py-3 text-[14px] font-semibold text-white hover:bg-brand-dark">
                Create account
              </button>
              <p className="text-center text-[11.5px] leading-relaxed text-muted">
                By signing up you agree to calcal&apos;s terms and privacy notice.
              </p>
            </form>
            <p className="mt-4 text-center text-[13px] text-muted">
              Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden flex-col justify-between bg-brand-soft/60 p-10 md:flex">
        <div />
        <div className="max-w-md">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand">Get started</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Your calendar, under control.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Set your hours once and share a single link. calcal handles the confirmation, the reminders and the payment.
          </p>
          <div className="mt-8 rounded-xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12.5px] font-semibold">30 Minute Meeting</p>
                <p className="text-[11.5px] text-muted">Tue, Nov 10 · 9:30am</p>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10.5px] font-semibold text-brand">Confirmed</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">SM</span>
              <p className="text-[12px] text-muted">Reminder sent 24h before</p>
            </div>
          </div>
        </div>
        <p className="text-[12px] text-muted">Trusted by 100,000+ teams</p>
      </div>
    </div>
  );
}
