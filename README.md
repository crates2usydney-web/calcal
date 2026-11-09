# calcal

A Calendly-style scheduling app built with Next.js 15, TypeScript, Tailwind CSS 4 and SQLite (node:sqlite).

## Run

```bash
npm install --cache .npmcache
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Demo accounts

| Account | Email | Password | Public page |
|---|---|---|---|
| Seeded | sam@example.com | demo1234 | /sam |
| Created in walkthrough | alex@calcal.app | secret123 | /alex |

You can also create a fresh account at /signup.

## What works

- Marketing landing page with pricing tiers (Free / Standard / Teams / Enterprise)
- /pricing page with a 45-row feature comparison table (Free vs Standard vs Teams vs Enterprise)
- Free plan enforcement: 1 event type max, with upgrade prompt
- Sign up, log in, log out (cookie sessions, scrypt password hashing)
- Dashboard: event types list, create/edit/delete, copy booking link
- Availability editor (weekly hours per weekday)
- Public profile page (/username) and booking page (/username/slug)
- Month calendar + day + time slot selection, timezone-aware slot generation
- Booking form with conflict detection (booked slots disappear)
- Confirmation page with ICS download and cancel
- Host bookings list (upcoming / past / canceled)
- Settings: name, username, welcome message
- SQLite storage at data/app.db (auto-seeded on first run)

## Routes

| Route | Purpose |
|---|---|
| / | Landing |
| /pricing | Plans + full feature comparison |
| /login, /signup | Auth |
| /dashboard | Event types |
| /dashboard/event-types/new, /dashboard/event-types/[id] | Create / edit |
| /dashboard/availability | Weekly hours |
| /dashboard/bookings | Bookings list |
| /dashboard/settings | Profile settings |
| /[username] | Public profile |
| /[username]/[slug] | Booking page |
| /booking/[id] | Confirmation / cancel |
| /api/ics/[id] | Calendar file |

## Reference material

- recordings/ — 50+ screenshots of the real Calendly (onboarding, scheduling, booking, settings, plans)
- recordings/README.md — screen index
- calendly-analysis.md — full product teardown, feature/plan matrix, data model and roadmap for calcal
- plans-free-vs-paid.md — the Free vs Paid breakdown (all 63 rows, what to gate and why)

## Notes / next steps

- Slot generation uses the host timezone; invitee timezone selector is a planned enhancement.
- Reminders, payments, routing forms, polls and round-robin are stubbed in the UI/roadmap, not yet implemented.
- Plan field is stored per user (default `free`); gating currently enforces the event-type limit only.
- Before shipping: replace the "calcal" placeholder domain, add email delivery (Resend/Postmark), and add Stripe for paid event types.

---

## Email system

Booking and cancellation emails mirror Calendly's pattern: sender `notifications@calcal.app`, subjects like
"New Event: {invitee} - {time} {date} - {event type}", centered logo + event card + action buttons.

- Every booking queues: invitee confirmation + host notification (sent immediately).
- Paid plans (Pro+) also queue reminders at T-24h and T-1h.
- Cancellation queues cancellation emails for both sides.
- Deliveries are written to the `emails` table (outbox) and marked `sent`.
- Set `RESEND_API_KEY` (or swap `deliverOne` for SES/Postmark) to deliver for real. Without it, the outbox is the transport.
- Outbox UI: /dashboard/emails (view HTML, run due emails, send test).

Cron:

```bash
curl -X POST "$APP_URL/api/cron/reminders" -H "Authorization: Bearer $CRON_SECRET"
```

Run every minute (Fly scheduled machine, Vercel cron with `CRON_SECRET`, GitHub Actions, cron-job.org).

## REST API

Full reference at /docs/api. Create keys at /dashboard/api-keys.

```bash
curl -H "Authorization: Bearer $KEY" $APP_URL/api/v1/me
curl -H "Authorization: Bearer $KEY" $APP_URL/api/v1/event-types
curl -H "Authorization: Bearer $KEY" "$APP_URL/api/v1/slots?event_type_id=ID&date=2026-11-10"
curl -X POST $APP_URL/api/v1/bookings -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"event_type_id":"ID","start":"2026-11-10T15:00:00Z","name":"Jamie","email":"jamie@example.com"}'
```

## Deploy

Docker:

```bash
docker compose up --build
```

or:

```bash
docker build -t calcal .
docker run -p 3000:3000 -v calcal-data:/app/data \
  -e APP_URL=https://your-domain -e CRON_SECRET=... -e RESEND_API_KEY=... calcal
```

Fly.io:

```bash
fly launch --no-deploy
fly volumes create calcal_data --size 1
fly secrets set CRON_SECRET=... RESEND_API_KEY=... APP_URL=https://your-app.fly.dev
fly deploy
```

Notes:
- SQLite lives at `DATABASE_PATH` (default ./data/app.db); mount a persistent volume in production.
- Health check: GET /api/health.
- Set `CRON_SECRET` — the reminders endpoint rejects other callers.
- `NODE_OPTIONS=--experimental-sqlite` is set in the Docker image (Node 24).

## Team & round-robin booking

- **Team page** (/dashboard/team): add teammates by email; new emails create a demo account (password `demo1234`) with Mon–Fri 9–5 availability.
- **Event type → Hosts & assignment**: choose *One host* or *Round robin* (Teams plan+), then tick the hosts.
- **Availability**: a round-robin event shows the **union** of every host's free slots; a slot is bookable if at least one host is free.
- **Assignment**: on booking, calcal filters hosts free at that instant, then picks the one with the **fewest upcoming bookings** (ties broken by list order). The booking is stored against that host.
- **Emails**: confirmation goes to the invitee, host notification + reminders go to the **assigned host**.
- **API**: `POST /api/v1/event-types` accepts `{"assignment":"round_robin","host_ids":["..."]}`; `PATCH` accepts both too.

Demo data: `alex` (Teams) with teammates `jordan` and `priya`, and a **Team Intro Call** round-robin event (calcal.app/alex/team-intro).

Round robin requires the Teams plan or higher; Free/Pro see the option locked with an upgrade link.
## Integrations

- **65 integrations** across Calendars, Video, CRM, Payments, Marketing, Automation, Productivity, Analytics, Support, AI and Messaging (see src/lib/integrations/catalog.ts).
- /dashboard/integrations: search, category filters, connect/disconnect. Connections are stored per user; without provider credentials they run in **demo mode** (status recorded, UI green).
- OAuth keys live in env (GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID, ZOOM_CLIENT_ID, SLACK_CLIENT_ID, STRIPE_SECRET_KEY ...). Plug a real OAuth callback per provider to replace demo mode.

## Webhooks (Zapier / Make / n8n ready)

- /dashboard/webhooks: create endpoints, pick events, see the HMAC secret and delivery log.
- Events: booking.created, booking.canceled, booking.rescheduled, invitee.created.
- Payload: booking + event type + host + invitee (see src/lib/integrations/engine.ts).
- Headers: X-Calcal-Event, X-Calcal-Delivery, X-Calcal-Signature: sha256=HMAC_SHA256(secret, body).
- Delivery: 8s timeout, exponential backoff, up to 5 attempts; retry via the UI or the API.
- API: GET/POST /api/v1/webhooks, DELETE /api/v1/webhooks/:id, POST /api/v1/webhooks/:id/test.

Any Zapier/Make/n8n "Webhook" action can subscribe by pointing at your own receiver; calcal signs every request so receivers can verify authenticity.
## Google Calendar (OAuth + busy-time sync)

Routes:

- GET /api/integrations/google-calendar/authorize -> Google consent (requires login)
- GET /api/integrations/google-calendar/callback -> token exchange, encrypted storage, first sync
- GET /api/integrations/google-calendar/sync -> refresh + free/busy sync
- Sync now / Disconnect buttons on /dashboard/integrations

Setup:

1. Create an OAuth client in Google Cloud (type: Web application).
2. Add redirect URI: APP_URL/api/integrations/google-calendar/callback
3. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and APP_SECRET (token encryption key).
4. Connect from /dashboard/integrations.

Without keys the card offers **Connect demo**, which seeds 42 busy blocks (weekday 12:00-13:00 and 15:00-15:30 in the host timezone) so you can see slot blocking. Tokens are AES-256-GCM encrypted at rest; expired access tokens refresh automatically.

Verified: connecting demo removed 12:00, 12:30 and 15:00 from the 2026-11-12 slot list while 15:30 remained bookable.

## Deploy checklist

- [ ] APP_URL set to the public https URL
- [ ] APP_SECRET set (OAuth token encryption)
- [ ] DATABASE_PATH on a persistent volume
- [ ] CRON_SECRET set + scheduler calling /api/cron/reminders every minute
- [ ] RESEND_API_KEY + verified sending domain
- [ ] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (optional)
- [ ] /api/health monitored
- [ ] Volume snapshots / SQLite backups
## Payments (Stripe Checkout)

- Event types can set a **price + currency + require payment** (Pro+ only).
- Booking a paid event creates an unpaid booking and redirects to /booking/:id/pay.
- With STRIPE_SECRET_KEY set, "Pay with card" creates a Stripe Checkout Session and redirects; the success URL verifies the session then marks the booking paid. Webhook POST /api/stripe/webhook handles checkout.session.completed (signature verified with STRIPE_WEBHOOK_SECRET).
- Without keys, the pay page runs in **demo mode**: a "Pay (demo)" button marks the booking paid so you can exercise the full flow.
- Confirmation shows "Payment received" or a "Pay now" banner.

Verified: a $50 paid event booked through the API produced payment_status=unpaid, the pay page rendered USD 50.00, demo payment marked it paid, and the confirmation showed "Payment received: USD 50.00".

## Google Calendar status

The OAuth code path (authorize/callback/refresh/freeBusy) remains, but credentials were removed after Google rejected the localhost redirect during setup. The integrations card falls back to **Connect demo**, which seeds busy blocks and still exercises slot blocking.
---

## Production deploy (Render / Fly / Docker)

Artifacts:

- Dockerfile (multi-stage, standalone output, non-root, /app/data volume, HEALTHCHECK)
- docker-compose.yml (local container with volume)
- render.yaml (Render web service + 1-minute reminder cron + 1GB disk)
- fly.toml (Fly app, /data volume, health check)
- .env.production.example (public env template)
- scripts/preflight.mjs (env + callback checklist)

### Render (recommended)

1. Push this repo to GitHub.
2. Render -> New -> Blueprint -> select the repo (render.yaml).
3. Set the sync:false env vars: APP_URL (https://<service>.onrender.com), RESEND_API_KEY, MAIL_FROM, GOOGLE_CLIENT_ID/SECRET, STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET.
4. Render provisions the disk at /app/data and the cron job that calls /api/cron/reminders every minute.
5. After the first deploy, register callbacks:
   - Google: https://<domain>/api/integrations/google-calendar/callback
   - Stripe: https://<domain>/api/stripe/webhook
6. Verify: curl https://<domain>/api/health

### Fly.io

fly launch --no-deploy
fly volumes create calcal_data --size 1
fly secrets set APP_URL=https://<app>.fly.dev APP_SECRET=$(openssl rand -hex 32) CRON_SECRET=$(openssl rand -hex 16)
fly secrets set RESEND_API_KEY=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
fly deploy

Schedule the reminder job with a Fly scheduled machine or an external cron (see fly.toml comment).

### Docker

docker build -t calcal .
docker run -p 3000:3000 -v calcal-data:/app/data --env-file .env.production calcal

The image exposes GET /api/health for load balancers and includes a container HEALTHCHECK.

### Post-deploy checklist

- APP_URL is the public https URL (links and OAuth redirects depend on it)
- APP_SECRET set and stable (token encryption; changing it disconnects OAuth)
- CRON_SECRET set; scheduler hitting /api/cron/reminders every minute
- Persistent volume mounted at /app/data (SQLite)
- RESEND_API_KEY + verified domain for real email
- Google redirect URI and Stripe webhook registered on the public domain
- Backups: snapshot the volume or copy /app/data/app.db nightly
- Monitor /api/health

Local production smoke test: npm run build && npm run start:standalone (serves .next/standalone/server.js).

See [DEPLOY.md](DEPLOY.md) for the full Render/Fly/Docker runbook.

Docker image verified locally: build succeeds, container reports healthy, /api/health, /pricing, /docs/api and static assets return 200, and SQLite persists across restarts on the mounted volume.
## Live demo

https://calcal-yzv8.onrender.com (Render, Docker, Starter instance 0.5 CPU / 512 MB).

- 1 GB persistent disk mounted at /app/data; SQLite at /app/data/app.db.
- Verified: a booking created before a full rebuild was still there afterwards (the 9:30 slot stayed booked).
- No sleep/cold starts on Starter.
- Reminder cron is not configured yet; create a Render Cron Job (or external scheduler) that calls POST /api/cron/reminders every minute with CRON_SECRET.
