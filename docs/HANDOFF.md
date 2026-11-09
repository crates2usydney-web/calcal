# calcal — handoff report

**Snapshot:** 9 Nov 2026, taken immediately before the Render service was deleted at the owner's request.
**Repo:** https://github.com/crates2usydney-web/calcal (branch `main`, last commit before shutdown `30b108d`)
**Live URL (now removed):** https://calcal-yzv8.onrender.com
**Local dev:** `npm install && npm run dev` → http://localhost:3000 (SQLite at `data/app.db`)

---

## 1. What calcal is

A Calendly-style scheduling platform: marketing site, auth, event types, availability, public booking pages, bookings, meeting polls, routing forms, single-use links, integrations, webhooks, public API, email pipeline, payments (demo), and an owner admin console.

Stack: **Next.js 15 App Router + React 19 + TypeScript + Tailwind 4**, SQLite (`node:sqlite`, WAL) at `DATABASE_PATH`, cookie sessions (`cal_sid`, scrypt), server actions, no external queue.

Key files:
- `src/lib/db.ts` — schema + idempotent migrations (all tables below)
- `src/lib/actions.ts` — auth, events, availability, bookings, polls, routing, team, webhooks, API keys
- `src/lib/email.ts` — queue, templates, Resend delivery
- `src/lib/google.ts`, `src/lib/microsoft.ts` — OAuth + free/busy
- `src/lib/admin.ts`, `src/lib/admin-actions.ts` — owner console
- `src/app/api/v1/*` — REST API (`availability, bookings, emails, event-types, integrations, me, public, slots, webhooks`)
- `src/app/api/cron/reminders` — scheduler endpoint, `Authorization: Bearer $CRON_SECRET`

Tables: users, sessions, event_types, availability, bookings, emails, oauth_connections, calendar_busy, integration_connections, webhook_endpoints, webhook_deliveries, team_members (role/status/invite fields), event_type_hosts, single_use_links, polls/poll_options/poll_votes, routing_forms/routing_submissions, api_keys, audit_log, invoices.

---

## 2. What is actually working (verified end-to-end)

**Scheduling core**
- Event types CRUD, duplicate, active toggle, colour, duration, location, price, solo / round-robin / collective assignment, 3-event-type limit on Free
- Availability weekly editor (copy Monday, per-day toggles), timezone-aware slots, buffers in the booking engine
- Public booking page (`/{username}/{slug}`) with prefill, slot picking, confirmation, ICS (`/api/ics/{id}`), booking view (`/booking/{id}`), cancel + cancellation emails
- Meeting polls: create options, public vote page, results, auto-book winning slot, already-scheduled state
- Routing forms: questions (text/choice), branching rules, public form, routed event type
- Single-use links: create/list/revoke, enforced at booking

**Integrations**
- Google Calendar: real OAuth, encrypted tokens, freebusy sync, disconnect, demo fallback. **Live sync endpoint currently errors** (connection works; see §5)
- Outlook Calendar: real Microsoft Graph OAuth, calendarView busy sync, disconnect — **works live**
- Microsoft 365 (Exchange Online): second provider, same Graph path, own connection, sync + disconnect — **works live**
- 65-app catalog, demo connect for the rest; provider status panel (live/demo/off) in Settings

**Email**
- Queue-based: confirmation, host notification, reminder (24h + 1h, Pro+), cancellation, test
- Resend live: `RESEND_API_KEY` set, sender `onboarding@resend.dev`, verified deliveries ("Opened" in Resend log, received in Gmail)
- Cron: Render cron job `calcal-reminders` (`*/5 * * * *`, Node, `node scripts/cron.mjs`) — run returned 200 `{"ok":true,"sent":0,"failed":0}`

**Admin (owner-only)**
- `/dashboard/admin`: overview, **Members & roles** (invite, role, deactivate, resend, remove, seat limits), **Plan & seats** (plan switch, invoice create/mark paid), **Usage** (bookings, polls, routing, 30-day chart, top events), **Health** (providers, webhook success rate, reminder queue, connections), **Audit log**
- Server-side `requireOwner()` on every admin route and action; members get `307 → /dashboard?denied=owner` (verified)

**Platform/ops**
- Webhooks with deliveries + retry, API keys (hashed, prefix), `/docs/api` page
- Plan gating helpers (event types, reminders, payments, round robin)
- Marketing home, pricing, login/signup, settings (profile, password, link, integration status)

---

## 3. Deleted infrastructure (what must be recreated)

| Resource | Detail |
|---|---|
| Render web service `calcal` | Docker, Starter `0.5c-512mb`, 1 GB disk at `/app/data`, `DATABASE_PATH=/app/data/app.db`, repo public, manual deploys |
| Render cron job `calcal-reminders` | Node, `npm install`, `node scripts/cron.mjs`, `*/5 * * * *`, env `CRON_SECRET` |
| Live SQLite data | **Lost** with the disk: 2 users, bookings, queued/sent emails, OAuth tokens (Google/Outlook/M365), integrations, webhooks, polls, routing forms, invoices, audit log. Demo data only — seed recreates a demo user on first boot |

**Credentials saved locally** in `.local-backup/render-env.txt` (gitignored): CRON_SECRET, RESEND_API_KEY, GOOGLE_CLIENT_ID/SECRET, MICROSOFT_CLIENT_ID/SECRET, MAIL_FROM, APP_URL, DATABASE_PATH. **APP_SECRET was not recoverable** — generate a new one on restore.

**Third-party apps (still alive, reuse them):**
- **Google Cloud** project `heroic-habitat-353421`, OAuth client "Web client 1", id `1051156166703-u51kof046d17r1tnv9vl14g1rbcflia2.apps.googleusercontent.com`, redirect URI for `/api/integrations/google-calendar/callback` (add the new domain)
- **Microsoft Entra** app `calcal`, client id `a62d5d95-de54-4c41-a02e-00f27efd5359`, tenant `89624650-6cb6-477a-a8b7-f56d161f445d`, multi-tenant + personal, redirect URIs `/api/integrations/outlook/callback` (both MS providers share this callback), client secret in backup file, delegated `Calendars.Read`+`User.Read`
- **Resend** workspace `crates2usydney` (Google sign-in `crates2usydney@gmail.com`), API key `calcal` in backup file. Sender `onboarding@resend.dev` only delivers to that owner inbox until a domain is verified
- **Render** account: workspace "Sam's workspace", project "My project", region Oregon

---

## 4. Restore checklist (≈30 minutes)

1. `git clone` repo, `npm install`, `npm run dev` — confirm demo data seeds
2. Create Render web service from the public repo (Docker), add disk `/app/data` 1 GB
3. Env: `APP_SECRET` (**new**, 32+ random bytes), `APP_URL` (new URL), `CRON_SECRET`, `DATABASE_PATH=/app/data/app.db`, `MAIL_FROM`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET`
4. Add the new `/api/integrations/google-calendar/callback` and `/api/integrations/outlook/callback` redirect URIs in Google Cloud / Entra
5. Create the cron job again (`node scripts/cron.mjs`, `*/5 * * * *`, `CRON_SECRET`)
6. Reconnect Google / Outlook / Microsoft 365 from Integrations, then Settings → verify "live" badges
7. Send a test email from /dashboard/emails, check Resend log

---

## 5. Known gaps and bugs (in priority order)

**Bugs / rough edges**
1. **Google live "Sync now" returns `google=syncerror`** while the same call works locally and Outlook/M365 sync fine. Logging was added to the route (`console.error("google-calendar sync failed")`) but not captured before shutdown. Start here: read Render logs after reproducing.
2. Email sender is `onboarding@resend.dev` → real invitees get nothing until a domain is verified
3. Roles are stored (owner/admin/member) but only owner-vs-rest is enforced; admins have no scoped powers
4. Audit log covers admin actions only (not bookings, settings, API keys, webhooks)
5. Calendarconnections are **read-only busy** — bookings never create events in Google/Outlook
6. Stripe is demo: pay page marks paid without charging; no PayPal, coupons, packages

**Missing vs Calendly (full table in `docs/PARITY.md`)**
- Payments live (Stripe), PayPal
- Calendar write-back, on-prem Exchange (EWS), iCloud/CalDAV
- SMS reminders, workflow builder, email template editor
- Custom questions, post-booking redirect, reschedule policy, branding/logo/custom domain, hide badge
- Date overrides, multiple schedules, min-notice UI, daily limits
- Embed widgets, WordPress/Chrome, mobile apps, localisation
- Real CRM/marketing integrations (only 3 of 65 are real)
- Groups, team booking pages, SSO/SAML, SCIM, domain control, 2FA, data export/deletion, SOC2/HIPAA
- Analytics reporting beyond admin usage; signed webhooks; API OAuth apps + rate limits

---

## 6. Recommended next steps (when the owner is back)

**Week 1 — make money real**
- Stripe live checkout + webhook + refund; replace demo pay page. Acceptance: a test-mode charge shows on the booking, webhook flips `payment_status`, refund reverses it.
**Week 2 — make bookings visible in calendars**
- Google/M365 event creation on booking, update on reschedule, delete on cancel. Acceptance: booking appears in host calendar with invitee + ICS.
**Week 3 — make email trustworthy**
- Verify `crates2u.com.au` (or chosen domain) in Resend, switch `MAIL_FROM`, SPF/DKIM; test to an external address.
**Then, in order:** custom questions/redirect → buffers & date overrides → embed widgets → SMS → branding/custom domain → analytics → real integrations → SSO/2FA/compliance → localisation/mobile.

**Parity backlog** lives in `docs/PARITY.md` (P0/P1/P2 with effort tags) — work top-down.

---

## 7. Verification commands that worked

```bash
npm run build                       # type-check + prod build
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('data/app.db');console.log(d.prepare('select count(*) n from users').get())"
curl -s -H "Cookie: cal_sid=<sid>" http://localhost:3000/dashboard/admin | head
curl -s -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/reminders
node scripts/cron.mjs               # with APP_URL + CRON_SECRET in env
```

Demo logins (local seed): `sam@example.com / demo1234`, `alex@calcal.app` (team owner), `jordan@calcal.app`, `priya@calcal.app`.
