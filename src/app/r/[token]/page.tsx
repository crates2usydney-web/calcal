import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { db } from "@/lib/db";
import { submitRoutingFormAction } from "@/lib/actions";

export default async function RoutingFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const form = db
    .prepare(
      "SELECT f.id, f.title, f.description, f.questions, u.name AS host_name FROM routing_forms f JOIN users u ON u.id = f.user_id WHERE f.token = ?"
    )
    .get(token) as { id: string; title: string; description: string; questions: string; host_name: string } | undefined;
  if (!form) notFound();

  let questions: { key: string; label: string; type?: string; options?: string[] }[] = [];
  try { questions = JSON.parse(form.questions || "[]"); } catch { questions = []; }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-line bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo size={24} />
          <span className="text-[12.5px] text-muted">Scheduling by calcal</span>
        </div>
      </header>

      <main className="container-x max-w-[640px] py-10">
        <form action={submitRoutingFormAction} className="rounded-2xl border border-line bg-white p-8">
          <input type="hidden" name="token" value={token} />
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand">Before you book</p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em]">{form.title}</h1>
          <p className="mt-1 text-[13.5px] text-muted">A few quick questions for {form.host_name}.</p>
          {form.description && <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{form.description}</p>}

          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Your name</label>
                <input name="name" required className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" required className="input" />
              </div>
            </div>

            {questions.map((q) => (
              <div key={q.key}>
                <label className="label">{q.label}</label>
                {q.type === "select" && q.options && q.options.length ? (
                  <select name={q.key} className="input" defaultValue="">
                    <option value="" disabled>Select an option</option>
                    {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input name={q.key} className="input" />
                )}
              </div>
            ))}
          </div>

          {sp.error === "missing" && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">Name and email are required.</p>
          )}

          <button className="btn btn-primary mt-6 w-full">Continue to booking</button>
          <p className="mt-3 text-center text-[11.5px] text-muted">Your answers are shared with {form.host_name}.</p>
        </form>
        <p className="mt-5 text-center text-[12px] text-muted">Powered by <Link href="/" className="font-semibold text-ink">calcal</Link></p>
      </main>
    </div>
  );
}