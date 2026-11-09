import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createApiKeyAction, revokeApiKeyAction } from "@/lib/actions";

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
      <h1 className="text-[26px] font-semibold tracking-tight">API keys</h1>
      <p className="mt-1 text-[14px] text-muted">
        Use these keys with the calcal REST API. Send <code className="rounded bg-mist px-1.5 py-0.5 text-[12px]">Authorization: Bearer &lt;key&gt;</code>.
      </p>
      <p className="mt-1 text-[13px] text-muted">
        Full reference: <Link href="/docs/api" className="font-medium text-brand hover:underline">API docs</Link>
      </p>

      {created && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[13px] font-semibold text-green-900">New key created — copy it now, it is shown once</p>
          <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-[12.5px] text-navy">{created}</code>
        </div>
      )}

      <form action={createApiKeyAction} className="mt-6 flex flex-wrap gap-2 rounded-xl border border-line bg-white p-4">
        <input name="name" placeholder="Key name (e.g. production)" className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-2 text-[13px]" />
        <button className="rounded-lg bg-navy px-4 py-2 text-[12.5px] font-semibold text-white">Create key</button>
      </form>

      <div className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        {keys.length === 0 && <p className="p-6 text-[13.5px] text-muted">No keys yet.</p>}
        {keys.map((k) => (
          <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[14px] font-medium">{k.name}</p>
              <p className="text-[12px] text-muted">
                {k.prefix}… · created {new Date(k.created_at).toLocaleDateString()} ·{" "}
                {k.last_used_at ? "last used " + new Date(k.last_used_at).toLocaleDateString() : "never used"}
              </p>
            </div>
            <form action={revokeApiKeyAction}>
              <input type="hidden" name="id" value={k.id} />
              <button className="rounded-lg border border-red-200 px-3 py-1.5 text-[12.5px] font-medium text-red-600">Revoke</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
