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
    <div className="flex min-h-screen flex-col bg-mist/40">
      <div className="mx-auto flex w-full max-w-6xl items-center px-5 py-6"><Logo /></div>
      <div className="flex flex-1 items-start justify-center px-5">
        <div className="mt-6 w-full max-w-md rounded-2xl bg-white p-8 card-shadow">
          <h1 className="text-[26px] font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-[14px] text-muted">Free forever. No credit card required.</p>
          {error === "exists" && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">An account with that email already exists.</p>
          )}
          {error === "missing" && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">Please fill all fields. Password needs 6+ characters.</p>
          )}
          <form action={signupAction} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Full name</label>
              <input name="name" required placeholder="Alex Morgan"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Email</label>
              <input name="email" type="email" required placeholder="you@company.com"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Username <span className="text-muted">(your link: calcal.app/username)</span></label>
              <input name="username" placeholder="alex"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Password</label>
              <input name="password" type="password" required minLength={6} placeholder="At least 6 characters"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            </div>
            <button className="w-full rounded-lg bg-brand py-3 text-[14px] font-semibold text-white hover:bg-brand-dark">
              Create account
            </button>
          </form>
          <p className="mt-5 text-center text-[13px] text-muted">
            Already have an account? <Link href="/login" className="font-medium text-brand hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
