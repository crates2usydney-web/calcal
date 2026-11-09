import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createApiKeyAction, revokeApiKeyAction } from "@/lib/actions";
import { PageHeader, Notice } from "@/components/PageHeader";

type KeyRow = { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null };

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { created } = await searchParams;
  const keys = db
    .prepare("SELECT id, name, prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? AND revoked = 0 ORDER BY created_at DESC")
    .all(user.id) as KeyRow[];

  return (
    <div className="max-w-3xl">
      <PageHeader title="API keys" subtitle="Use these keys with the calcal REST API. Send them as a bearer token.">
        <Link href="/docs/api" className="btn btn-outline">API docs</Link>
      </PageHeader>

      {created && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[13px] font-semibold text-green-900">New key created — copy it now, it is shown once</p>
          <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-[12.5px] text-ink">{created}</code>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-line bg-cloud/60 p-4">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Authentication</p>
        <code className="mt-1 block text-[12.5px] text-ink">Authorization: Bearer &lt;your key&gt;</code>
      </div>

      <form action={createApiKeyAction} className="mt-5 rounded-xl border border-line bg-white p-5">
        <h2 className="text-[14px] font-semibold">Create a key</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input name="name" placeholder="Key name (e.g. production)" className="input min-w-[220px] flex-1" />
          <button className="btn btn-primary">Create key</button>
        </div>
      </form>

      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white">
        <div className="divide-y divide-line">
          {keys.length === 0 && <p className="p-6 text-[13.5px] text-muted">No keys yet.</p>}
          {keys.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-[14px] font-medium">{k.name}</p>
                <p className="text-[12px] text-muted">
                  <span className="font-mono">{k.prefix}…</span> · created {new Date(k.created_at).toLocaleDateString()} ·{" "}
                  {k.last_used_at ? "last used " + new Date(k.last_used_at).toLocaleDateString() : "never used"}
                </p>
              </div>
              <form action={revokeApiKeyAction}>
                <input type="hidden" name="id" value={k.id} />
                <button className="rounded-full border border-red-200 px-3.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50">Revoke</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
