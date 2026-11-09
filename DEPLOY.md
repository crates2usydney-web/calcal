# calcal deployment runbook

calcal is a single Next.js 15 (standalone) container with SQLite on a mounted volume.
It needs one persistent disk, one public HTTPS URL and a 1-minute cron for reminders.

## What ships

| File | Purpose |
|---|---|
| Dockerfile | multi-stage build, non-root, /app/data volume, container HEALTHCHECK |
| render.yaml | Render Blueprint: web service + disk + reminder cron |
| fly.toml | Fly app, /data volume, HTTP health check |
| docker-compose.yml | local container with volume |
| .env.production.example | env template with callback URLs |
| scripts/preflight.mjs | validates env and prints callbacks |

## Option A — Render (fastest)

1. Push the repo to GitHub.
2. Render Dashboard → New → Blueprint → pick the repo.
3. Render reads render.yaml and creates:
   - web service `calcal` (Docker, health check /api/health, disk mounted at /app/data)
   - cron `calcal-reminders` running every minute
4. Fill the sync:false env vars: APP_URL (https://<service>.onrender.com), RESEND_API_KEY, MAIL_FROM, GOOGLE_CLIENT_ID/SECRET, STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET.
5. Deploy. First boot creates and seeds the SQLite DB on the disk.

## Option B — Fly.io

```bash
fly launch --no-deploy
fly volumes create calcal_data --size 1
fly secrets set APP_URL=https://<app>.fly.dev \
  APP_SECRET=$(openssl rand -hex 32) \
  CRON_SECRET=$(openssl rand -hex 16)
fly secrets set RESEND_API_KEY=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
fly deploy
```

Reminder cron: run a Fly scheduled machine (command in fly.toml) or point an external scheduler (cron-job.org, GitHub Actions) at POST https://<app>.fly.dev/api/cron/reminders with Authorization: Bearer $CRON_SECRET.

## Option C — Docker on a VPS

```bash
docker build -t calcal .
docker run -d --name calcal -p 3000:3000 \
  -v calcal-data:/app/data --env-file .env.production calcal
```

Put Caddy/Nginx in front for TLS, and add a cron entry:

```
* * * * * curl -fsS -X POST https://your-domain/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"
```

## Environment reference

| Variable | Required | Notes |
|---|---|---|
| APP_URL | yes | public https URL, no trailing slash |
| APP_SECRET | yes | 32+ random chars; encrypts OAuth tokens — changing it disconnects providers |
| DATABASE_PATH | yes | /app/data/app.db (must be on the volume) |
| CRON_SECRET | yes | protects /api/cron/reminders |
| RESEND_API_KEY | optional | real email delivery; without it emails stay in the outbox |
| MAIL_FROM | optional | e.g. calcal <notifications@your-domain.com> |
| GOOGLE_CLIENT_ID / SECRET | optional | enables real Google Calendar OAuth |
| STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET | optional | enables real Checkout + webhook |

## After the first deploy

- Google Cloud → OAuth client → add redirect URI: https://<domain>/api/integrations/google-calendar/callback (localhost is rejected by Google)
- Stripe → Developers → Webhooks → add endpoint https://<domain>/api/stripe/webhook, copy the signing secret into STRIPE_WEBHOOK_SECRET
- Resend → verify the sending domain, set RESEND_API_KEY + MAIL_FROM
- Confirm cron is firing (Render cron logs / Fly machine)

## Verification

```bash
curl -fsS https://<domain>/api/health
curl -fsS https://<domain>/pricing -o /dev/null -w "%{http_code}\n"
curl -fsS -X POST https://<domain>/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"
```

Expected health: {"ok":true,"db":true,"users":N,"version":"1.0.0"}.

## Backups

- Snapshot the volume daily (Render disk snapshot / Fly volume snapshot).
- Or copy the DB: `sqlite3 /app/data/app.db ".backup /app/data/backup.db"` and ship it off-box.

## Troubleshooting

- "database is locked" at build: fixed by lazy DB init; rebuild with the latest code.
- 502 after deploy: check the container healthcheck and that DATABASE_PATH is on the mounted disk.
- OAuth redirect_uri_mismatch: the URI must match exactly, including https and no trailing slash.
- Google "invalid_client" on localhost: expected — use the deployed https domain.
- Emails not arriving: RESEND_API_KEY and verified domain are required; check /dashboard/emails outbox.