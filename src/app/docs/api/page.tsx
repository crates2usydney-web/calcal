import Link from "next/link";
import { Logo } from "@/components/Logo";

const endpoints: [string, string, string][] = [
  ["GET", "/api/v1/me", "Current user + plan"],
  ["GET", "/api/v1/event-types", "List event types"],
  ["POST", "/api/v1/event-types", "Create event type"],
  ["GET", "/api/v1/event-types/:id", "Get event type"],
  ["PATCH", "/api/v1/event-types/:id", "Update event type"],
  ["DELETE", "/api/v1/event-types/:id", "Delete event type"],
  ["GET", "/api/v1/availability", "Weekly availability"],
  ["PUT", "/api/v1/availability", "Replace availability rules"],
  ["GET", "/api/v1/bookings", "List bookings (?status=&from=&to=)"],
  ["POST", "/api/v1/bookings", "Create booking (sends emails)"],
  ["GET", "/api/v1/bookings/:id", "Get booking"],
  ["POST", "/api/v1/bookings/:id/cancel", "Cancel booking"],
  ["GET", "/api/v1/slots?event_type_id=&date=", "Slots for a day"],
  ["GET", "/api/v1/emails", "Outbox"],
  ["POST", "/api/v1/emails/run", "Deliver due emails"],
  ["GET", "/api/v1/public/:username", "Public host + event types"],
  ["GET", "/api/v1/public/slots?username=&slug=&date=", "Public slots"],
  ["GET", "/api/v1/integrations", "Integration catalog + connection status"],
  ["POST", "/api/v1/integrations/:app", "Connect an integration (demo)"],
  ["DELETE", "/api/v1/integrations/:app", "Disconnect"],
  ["GET", "/api/v1/webhooks", "List webhook endpoints"],
  ["POST", "/api/v1/webhooks", "Create webhook endpoint"],
  ["DELETE", "/api/v1/webhooks/:id", "Delete endpoint"],
  ["POST", "/api/v1/webhooks/:id/test", "Send a test delivery"],
  ["GET", "/api/integrations/google-calendar/authorize", "Start Google OAuth (session)"],
  ["GET", "/api/integrations/google-calendar/callback", "Google OAuth callback"],
  ["GET", "/api/integrations/google-calendar/sync", "Sync Google busy blocks"],
  ["GET", "/api/health", "Health check"],
  ["POST", "/api/cron/reminders", "Cron: deliver due emails"],
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Logo />
          <div className="flex gap-4 text-[13px] font-medium">
            <Link href="/dashboard/api-keys" className="text-navy">API keys</Link>
            <Link href="/dashboard" className="text-brand">Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-12">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-brand">Developers</p>
        <h1 className="mt-2 text-[36px] font-semibold tracking-tight">calcal API v1</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          JSON REST API for event types, availability, bookings and the email outbox. Authenticate with a bearer key from the dashboard.
        </p>
        <section className="mt-8 rounded-2xl border border-line bg-mist/30 p-5">
          <h2 className="text-[15px] font-semibold">Authentication</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-navy px-4 py-3 text-[12.5px] text-white">Authorization: Bearer cal_live_xxxxxxxxxxxxxxxx</pre>
          <p className="mt-2 text-[13px] text-muted">Create and revoke keys at /dashboard/api-keys.</p>
        </section>
        <section className="mt-8">
          <h2 className="text-[19px] font-semibold">Endpoints</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-mist/50 text-[11px] uppercase tracking-wide text-muted">
                <tr><th className="px-4 py-3">Method</th><th className="px-4 py-3">Path</th><th className="px-4 py-3">Description</th></tr>
              </thead>
              <tbody>
                {endpoints.map(([m, p, d]) => (
                  <tr key={p + m} className="border-t border-line">
                    <td className="px-4 py-2.5 font-mono text-[11.5px] font-semibold text-brand">{m}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px] text-navy">{p}</td>
                    <td className="px-4 py-2.5 text-muted">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-[13.5px] font-semibold">Create a booking</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-navy px-3 py-2 text-[11.5px] text-white">{`POST /api/v1/bookings\n{ "event_type_id": "...", "start": "2026-11-10T15:00:00Z",\n  "name": "Jamie", "email": "jamie@example.com" }`}</pre>
            <p className="mt-1 text-[12px] text-muted">Queues confirmation + host notification, reminders on paid plans.</p>
          </div>
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-[13.5px] font-semibold">Slots</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-navy px-3 py-2 text-[11.5px] text-white">{`GET /api/v1/slots?event_type_id=UUID&date=2026-11-10`}</pre>
            <p className="mt-1 text-[12px] text-muted">Returns ISO start/end + display label.</p>
          </div>
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-[13.5px] font-semibold">Round-robin event type</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-navy px-3 py-2 text-[11.5px] text-white">{`POST /api/v1/event-types\n{ "title": "Team Intro", "assignment": "round_robin",\n  "host_ids": ["uuid", "uuid"] }`}</pre>
            <p className="mt-1 text-[12px] text-muted">Teams plan+. PATCH also accepts assignment and host_ids.</p>
          </div>
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-[13.5px] font-semibold">Availability</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-navy px-3 py-2 text-[11.5px] text-white">{`PUT /api/v1/availability\n{ "rules": [ { "weekday": 1, "start": "09:00", "end": "17:00" } ] }`}</pre>
          </div>
          <div className="rounded-xl border border-line p-5">
            <h3 className="text-[13.5px] font-semibold">Reminder cron</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-navy px-3 py-2 text-[11.5px] text-white">{`POST /api/cron/reminders\nAuthorization: Bearer $CRON_SECRET`}</pre>
            <p className="mt-1 text-[12px] text-muted">Run every minute from a scheduler.</p>
          </div>
        </section>
        <section className="mt-10 rounded-2xl border border-line p-5">
          <h2 className="text-[15px] font-semibold">Webhooks</h2>
          <p className="mt-1 text-[13px] text-muted">
            Every delivery includes <code className="rounded bg-mist px-1">X-Calcal-Event</code> and
            <code className="ml-1 rounded bg-mist px-1">X-Calcal-Signature: sha256=HMAC_SHA256(secret, rawBody)</code>.
            Retries use exponential backoff up to 5 attempts; trigger them with the Retry button or the API.
          </p>
        </section>
        <section className="mt-10 rounded-2xl border border-line p-5">
          <h2 className="text-[15px] font-semibold">Errors</h2>
          <p className="mt-1 text-[13px] text-muted">JSON body with an error string. 401 unauthorized, 402 plan limit, 404 not found, 422 validation.</p>
        </section>
      </main>
    </div>
  );
}