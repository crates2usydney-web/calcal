# calcal vs live Calendly — gap analysis (Nov 2026)

Legend: ✅ shipped · 🟡 partial/scaffolded · ⛔ not yet

## Scheduling core

| Capability | Calendly | calcal | Notes |
|---|---|---|---|
| Event types CRUD | ✅ | ✅ | title, slug, duration, location, description, colour |
| 1:1 booking page | ✅ | ✅ | /{username}/{slug} |
| Month/day/slot picker | ✅ | ✅ | timezone-aware slots |
| Conflict detection | ✅ | ✅ | bookings + external busy blocks |
| Buffers / min notice / date range | ✅ | 🟡 | 4h notice fixed; buffers/date-range not exposed |
| Multi-calendar conflict checks | ✅ | 🟡 | Google Calendar free/busy wired (OAuth + demo mode) |
| Reschedule | ✅ | ⛔ | cancel + rebook only |
| Custom questions | ✅ | ⛔ | notes field only |
| Group / collective events | ✅ | ⛔ | round robin only |
| Round robin | ✅ | ✅ | fair-share assignment + team page |
| Single-use links / polls | ✅ | ⛔ | tabs stubbed |
| Routing forms | ✅ | ⛔ | |

## Communication

| Capability | Calendly | calcal | Notes |
|---|---|---|---|
| Confirmation + host notification | ✅ | ✅ | outbox + Resend transport |
| Reminders (24h/1h) | ✅ | ✅ | Pro+ gate, cron endpoint |
| Cancellation emails | ✅ | ✅ | both sides |
| SMS / WhatsApp | ✅ | ⛔ | Twilio/WhatsApp in catalog only |
| Workflows builder | ✅ | ⛔ | |
| Calendar invitation (ICS) | ✅ | ✅ | /api/ics/:id |

## Money

| Capability | Calendly | calcal | Notes |
|---|---|---|---|
| Payments at booking | ✅ | ✅ | Stripe Checkout + demo mode, webhook, pay page |
| Packages / invoices | ✅ | ⛔ | single payments only |
| Coupons / terms | ✅ | ⛔ | |

## Platform & integrations

| Capability | Calendly | calcal | Notes |
|---|---|---|---|
| Integration catalog | 100+ | 65 | 11 categories, connect/disconnect |
| Real OAuth provider | ✅ | 🟡 | Google Calendar code path implemented; localhost redirect rejected by Google, demo mode active |
| Busy-time subtraction | ✅ | ✅ | free/busy + demo blocks; verified slots removed |
| Webhooks | ✅ | ✅ | HMAC signed, retries, delivery log |
| REST API | ✅ | ✅ | v1, API keys, docs |
| Zapier/Make/n8n | ✅ | ✅ | via webhooks + API |
| Stripe/PayPal | ✅ | ⛔ | next milestone |

## Teams & admin

| Capability | Calendly | calcal | Notes |
|---|---|---|---|
| Team members | ✅ | ✅ | add by email |
| Round robin | ✅ | ✅ | |
| Roles / permissions | ✅ | 🟡 | owner-centric |
| SSO / SCIM / audit | ✅ | ⛔ | Business tier placeholder |
| Analytics | ✅ | ⛔ | |

## AI

| Capability | Calendly | calcal | Notes |
|---|---|---|---|
| AI scheduling assistant | ✅ | ⛔ | catalog entries only |
| Notetaker / recaps | ✅ | ⛔ | |

## Experience & ops

| Capability | Calendly | calcal | Notes |
|---|---|---|---|
| Marketing site + pricing | ✅ | ✅ | 4 tiers |
| Onboarding wizard | ✅ | 🟡 | signup seeds defaults; no wizard |
| Mobile apps | ✅ | ⛔ | responsive web |
| Browser extension | ✅ | ⛔ | |
| Embeds | ✅ | ⛔ | |
| Deployable backend | n/a | ✅ | Docker/Fly, SQLite volume, health, cron |
| Email deliverability | ✅ | 🟡 | Resend; needs verified domain |
| Backups | ✅ | 🟡 | volume snapshot recommended |

## What is genuinely production-ready today

- Auth (scrypt, sessions), event types, availability, public booking, cancel, ICS.
- Round-robin with fair-share host assignment and team management.
- Email outbox + reminders + cron, Resend transport (needs key/domain).
- API v1 with hashed keys, webhooks with signatures/retries.
- Google Calendar OAuth code path (authorize → callback → token refresh → freebusy → slot blocking), with demo mode verified.
- Docker/Fly deployment, health check, env documentation.

## Next milestones (in order)

1. **Google Calendar production keys** — deploy to a public domain, re-add OAuth client, verify live freebusy.
2. **Payments hardening** — Stripe refunds, packages, invoices, tax.
3. **Workflows + SMS** — builder, Twilio.
4. **Polls / single-use links / routing forms**.
5. **Team roles, analytics, SSO**.
6. **AI assistant / notetaker**.