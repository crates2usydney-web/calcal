# calcal ↔ Calendly parity backlog

Legend: S = days, M = ~1-2 weeks, L = multi-week / external dependency.

## P0 — blocks "real product"
- [ ] Stripe live checkout + webhook + refund (M) — pay page currently marks paid without charging
- [ ] Calendar write-back: create/update/cancel event on Google/M365 (L)
- [ ] Verified sender domain (Resend, SPF/DKIM) and `MAIL_FROM` switch (S)
- [ ] Fix Google live `syncerror` (S) — logging already in the sync route
- [ ] On-prem Exchange (EWS) connector (L)
- [ ] API hardening: OAuth apps/scopes, rate limits, HMAC-signed webhooks (M)

## P1 — paid-tier parity
- [ ] Custom invitee questions + post-booking redirect + reschedule policy (M)
- [ ] Buffers / min-notice / date overrides / multiple schedules UI (M)
- [ ] Embed widgets (inline, popup, badge) + WordPress plugin (M)
- [ ] SMS reminders/confirmations (M, Twilio)
- [ ] Branding: logo upload, hide badge, custom domain (M)
- [ ] Analytics/reporting dashboards + CSV export (M)
- [ ] Real Zoom/Meet/Teams + HubSpot/Salesforce/Zapier (L)
- [ ] Groups, team booking pages, enforced admin permissions (M)
- [ ] 2FA, SSO/SAML, SCIM, domain control (L)
- [ ] Data export/deletion API, DPA/SOC2 posture (M)
- [ ] Localisation of booking pages (M)
- [ ] Mobile: PWA first, then apps (M/L)

## P2 — depth
- [ ] Coupons, packages, payment links, PayPal
- [ ] Routing scoring + CRM lead routing
- [ ] Email template editor + custom "from"
- [ ] Audit log expansion (bookings, settings, keys, webhooks) + audit API
- [ ] API docs expansion (`/docs/api`) and SDK snippets

## Already at/near parity
Round robin + collective, single-use links, polls with auto-book, routing with branching,
webhooks + retry, public API subset, ICS + booking view, Google/Outlook/M365 OAuth,
email queue + cron + Resend delivery, owner admin console (members/roles, plan/seats,
invoices, usage, health, audit), provider live/demo status panel.
