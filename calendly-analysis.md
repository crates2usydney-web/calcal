# Calendly — product teardown & analysis (for building "calcal")

Walkthrough date: Nov 2026. Account: new free account "Sam Macneil" (calendly.com/crates2usydney).
Evidence: 47 screenshots in recordings/ + pricing HTML (pricing.html, pricing_texts.json).

---

## 1. What Calendly is

A scheduling-as-a-service platform: a host publishes **event types** backed by **availability rules** and **connected calendars**; invitees book a slot on a public **booking page** without back-and-forth. Around that core it layers reminders/workflows, payments, routing forms, polls, team scheduling (round-robin/collective), AI (Callie, Notetaker), contacts, analytics and enterprise admin/security.

Positioning: "All the work around meetings, handled" — from AI-powered scheduling to automated recaps and follow-ups.

Core loop: Create event type -> set availability -> share link -> invitee picks slot -> both calendars updated -> reminders/follow-up.

---

## 2. Information architecture (as observed)

### Public / marketing
- Home, Product (Scheduling, Callie, Notetaker, Contacts, Payments, Integrations, Security, Mobile app, Browser extension, Admin controls), Solutions (by size: individuals, SMB, enterprise; by team: sales, marketing, CS, recruiting; by industry), Resources (learning hub, developer docs, product tour, blog, guides, customer stories, help center, community), Pricing, Log in / Get started.

### Logged-in app (new 2026 UI)
- **Drawer nav**: Create, Scheduling, Calendar, promo card ("Introducing the new Calendly" + Start the tour), Upgrade plan, Settings.
- **Scheduling** tabs: Event types | Single-use links | Meeting polls | Routing forms. Header: Manage availability, + Create, search.
- **Calendar**: date picker, Today / Upcoming / This week / Last week, search meetings, meeting list grouped by day, meeting detail panel (Reschedule / Cancel, Details / Notes, Invitees, Location, Hosts), gear menu (Buffers show/hide, Notetaker settings), export.
- **Create menu**: One-on-one (1 host -> 1 invitee), Group (1 host -> many), Round robin (rotating hosts -> 1 invitee), Collective (multiple hosts -> 1 invitee); More ways to meet: One-off meeting, Meeting poll.
- **Settings** (Account settings): My account — Profile, Scheduling, Branding, My link, Privacy; Features — Notetaker, Contacts settings; Admin — Workspace, Dashboard, People.
- **Profile**: General (avatar, name, welcome message) / Login; Save changes.
- **Scheduling settings**: Available hours / Calendars / Advanced availability; schedules ("Working hours (default)"), active-on event types; weekly hours editor.
- **Branding**: logo upload, apply to whole org.
- **Upgrade**: plan modal "Choose a plan that fits" — monthly/yearly toggle, Standard, Standard Plus, Teams, Enterprise, Compare all features.

### Onboarding (5 steps)
1. Usage intent (On my own / With my team) + "How can Calendly help you?" (multi-select).
2. Role (Finance, Sales, Customer success, Recruiting, Marketing, ...).
3. Connect calendar for conflict checks (Google / Outlook / Exchange).
4. Weekly availability (default Mon-Fri 9-5, Sunday unavailable).
5. Notetaker toggle + default meeting location (Zoom / Google Meet / Teams) -> "Setting up your Calendly".

---

## 3. Feature inventory (with plan gating)

### 3.1 Scheduling core
| Feature | Free | Standard | Teams | Enterprise |
|---|---|---|---|---|
| Event types | 1 | Unlimited | Unlimited | Unlimited |
| Calendar connections | 1 | Multiple | Multiple | Multiple |
| One-on-one scheduling | yes | yes | yes | yes |
| Customizable booking page | yes | yes | yes | yes |
| Browser extension | yes | yes | yes | yes |
| Group / collective / round-robin | - | - | yes | yes |
| Single-use links | - | yes | yes | yes |
| Meeting polls | - | yes | yes | yes |
| Routing forms / lead qualification | - | - | yes | yes (Salesforce lookup) |
| One-off meetings | - | yes | yes | yes |
| Buffers, minimum notice, date ranges | yes | yes | yes | yes |
| Timezone detection, 12/24h, multi-language | yes | yes | yes | yes |
| Embed widgets (inline/popup), custom branding | - | yes | yes | yes |
| Custom domains / white-label | - | - | - | yes (domain control) |

### 3.2 Availability & calendar
- Weekly hours per weekday, multiple intervals per day, copy-to-days, date overrides, buffers before/after, minimum scheduling notice, rolling date window (e.g. 60 days).
- Multiple schedules ("Working hours (default)") assignable to event types.
- Connected calendars: Google, Outlook/Microsoft 365, Exchange; conflict checks; connection limits by plan.
- Calendar settings: hide/show meeting buffers, Notetaker on/off.

### 3.3 Booking page (invitee experience)
- Host identity (avatar, name, welcome message), event card (title, duration, location, description).
- Month calendar -> day -> time slots (duration-grid, e.g. 30-min increments), visitor timezone selector, 12/24h.
- Details form: Name*, Email*, Add guests, free-text questions, consent/terms, "Schedule Event".
- Confirmation: "You are scheduled!", event card (host, date/time, timezone), calendar links (ICS/Google/Outlook), reschedule/cancel links (sent by email), add-to-calendar.
- Cancellation/reschedule flows; invitee can reschedule without host.

### 3.4 Notifications & workflows
- Email & SMS reminders (Standard+), custom reminder timing, follow-ups, thank-you emails.
- Workflows: trigger on booking/cancel/reschedule; conditions; email/SMS actions; templates.
- Calendar invites (ICS), optional meeting location details, daily limits, no-show tracking.

### 3.5 Payments
- Stripe / PayPal connect; charge upfront, packages, invoices; payment collected at booking; refunds; taxes (Stripe).
- Paid event types; "Collect payments when invitees book" (Standard+).

### 3.6 Teams & admin
- Round robin (distribute), collective (all hosts), group events (multiple invitees), team pages.
- Centrally managed event types, shared availability, roles (owner/admin/member), seat management, workspace settings.
- Analytics/Dashboard (meetings, conversion, no-shows, team performance), audit log, SSO/SAML, SCIM, domain control, data deletion API.
- Branding applied org-wide.

### 3.7 AI
- **Callie** (beta): AI scheduling assistant; add to email threads, finds times, books; interactive chat in app; "Ask Callie".
- **Notetaker**: joins Zoom/Meet/Teams, records, transcribes, recaps, action items; sharing controls, recording rules (Standard Plus+).
- "Ask Callie" in-app assistant button.

### 3.8 Contacts & CRM
- Contacts (relationship management), contact records, notes, activity; HubSpot/Mailchimp/Marketo/Pardot/Salesforce/Microsoft Dynamics integrations (tiered).
- Routing with Salesforce lookup (Enterprise).

### 3.9 Integrations & platform
- 100+ integrations: Google/Microsoft calendars, Zoom/Meet/Teams, Stripe/PayPal, HubSpot, Mailchimp, Marketo, Pardot, Salesforce, Dynamics, Zapier, Slack, and more.
- REST API + webhooks; embed (inline/popup); mobile apps (iOS/Android); browser extension; LinkedIn integration.

### 3.10 Security & compliance
- SSO/SAML (add-on on Teams, included Enterprise), SCIM, domain control, audit logs, SOC 2/GDPR, data deletion API, encryption, permissions.

---

## 4. Pricing (US, as extracted)

| Plan | Monthly | Annual (per seat/mo) | Positioning |
|---|---|---|---|
| Free | $0 | $0 | Personal scheduling starter |
| Standard | $12 | $10 (save 17%) | Professional scheduling, unlimited event types, integrations, payments |
| Standard Plus | $24 | $18 (save 25%) | Standard + Notetaker/Callie AI bundle |
| Teams | $20 | $16 (save 20%) | Team scheduling: round robin, routing, admin |
| Enterprise | from ~$15k/yr | - | Security, SSO/SAML, Salesforce lookup, Dynamics, dedicated support |

International (from page): Standard £10/£8, EUR 12/10; Standard Plus £20/£15, EUR 24/18; Teams £17/£13, EUR 20/16; Enterprise £27/£20, EUR 32/24.

**Gating logic**: Free = 1 event type + 1 calendar + 1:1 only. Standard unlocks volume + automation + payments + integrations. Teams adds people (round robin, routing, central admin). Enterprise adds security/compliance + CRM depth. Standard Plus is an AI upsell on top of Standard (Notetaker + Callie).

Trial/CTA: "Get started for free", "No credit card required", upgrade anytime; annual default with "save up to 20%".

---

## 5. Key user flows

### Signup -> onboarding -> first link
Signup (Google/Microsoft/email) -> 5-step wizard (intent, role, calendar, availability, location) -> loading -> Scheduling page with one 30-min event type -> "Copy link"/"View landing page".

### Book a meeting (invitee)
Public profile -> event type -> month/day -> time slot -> details (name/email/guests/notes) -> Schedule Event -> confirmation (calendar invite emailed) -> reschedule/cancel via email links.

### Host manages
Calendar -> Upcoming -> meeting card -> detail panel -> Reschedule/Cancel (with message, cancellation email to invitee); create event types from Create; availability from Manage availability; settings drill-down.

### Team scheduling
Create -> Round robin/Collective -> assign hosts -> share team link -> routing rules -> distribution by availability/fairness.

---

## 6. UI / design system

- **Colors**: navy #0B3558 (text/dark buttons), primary blue #0069FF, light blue #F0F6FF / #E8F1FF backgrounds, white cards, purple accent for event types (#7C3AED), green success, gray borders (#E5E7EB).
- **Type**: Inter-like grotesk; hero 56-72px tight; section titles 36-44; body 16; small 13-14.
- **Shape**: 8-12px radius cards/buttons; pill toggles; soft shadows; 1px borders.
- **Layout**: marketing = 1200px container, alternating hero/feature blocks, blue gradient hero with rounded 24px card; app = minimal top bar + drawer, content max-width; booking = two-column (host info 40% / interaction 60%) collapsing on mobile.
- **Components**: event card with colored left rail, meta row (duration | location | type), Copy link split-button, underline tabs, side sheets for editing, plan accordions, toggle chips for onboarding, step progress bar, empty-state illustrations.
- **Motion**: subtle fades, hover lift, skeleton loaders ("Setting up your Calendly"), toast "Saved".

---

## 7. Data model (inferred, for calcal)

- **User**: id, name, email, password/sso, username (public slug), timezone, avatar, welcome_message, role, plan.
- **Workspace/Org**: id, name, domain, branding(logo/color), plan, seats.
- **Membership**: user_id, workspace_id, role (owner/admin/member), seat_status.
- **EventType**: id, owner, title, slug, description, duration, location(type/value), color, active, schedule_id, buffers, min_notice, date_range, questions[], payment, assignment(round_robin/collective), hosts[], max_invitees.
- **Schedule/Availability**: id, name, timezone, rules[weekday -> intervals[]], overrides[date -> intervals/unavailable], buffers.
- **CalendarConnection**: id, user_id, provider, account_email, sync_token, primary.
- **Booking/Invitee**: id, event_type_id, host_id, invitee{name,email,timezone,phone}, start_utc, end_utc, status, notes, answers, payment_status, cancel_token, created_at.
- **Workflow**: id, trigger, conditions, actions[], active.
- **RoutingForm**: id, fields[], rules[], target_event_type.
- **Poll**: id, slots[], votes[].
- **SingleUseLink**: id, event_type_id, token, used_at.
- **Contact**: id, workspace_id, name, email, company, notes, custom_fields, source.
- **Integration**: id, workspace_id, provider, credentials, scopes.
- **AuditEvent**: id, actor, action, target, ts.

---

## 8. MVP scope for calcal

**MVP (ship first)**: auth + workspace, event types CRUD, weekly availability + overrides, public profile + booking page (month/day/slots, timezone), booking creation with conflict checks, confirmation + cancel, dashboard calendar/list, settings (profile, branding, link), pricing page with Free/Standard/Teams.

**V1 (differentiators)**: round robin/collective, routing forms, polls, single-use links, reminders (email), payments (Stripe test), embeds, ICS export, team pages, analytics.

**V2**: AI assistant, notetaker/recap, CRM sync, SSO, audit logs, API/webhooks, mobile.

**calcal positioning ideas**: faster setup (one-screen onboarding), transparent pricing, generous free tier (3 event types), built-in "meeting budget" analytics, open API from day one, privacy-first EU hosting.

---

## 9. Risks / notes for a clone

- Do not reuse Calendly trademarks/logos/assets in a shipped product; "calcal" branding with similar layout is safer.
- Timezone math and DST are the hardest correctness area; store UTC + host tz and use a tz library.
- Slot generation must subtract existing bookings, buffers, min-notice, date range and calendar busy times.
- Email/SMS reminders need a provider; start with in-app + ICS to keep MVP self-contained.
- Payments require Stripe Connect for payouts; gate behind a feature flag.

---

## 10. How Calendly sends email (verified in Gmail)

Inbox evidence (search `from:calendly.com`, 4 emails, Nov 2026):

| # | Subject | Sender |
|---|---|---|
| 1 | Canceled: 30 Minute Meeting with Test Invitee on 9 November 2026 | Calendly <notifications@calendly.com> |
| 2 | 🎉 You did it — your first booking... | Calendly |
| 3 | Sam, you booked your first meeting... | Calendly |
| 4 | New Event: Test Invitee - 11:30am Mon, 9 Nov 2026 - 30 Minute Meeting | Calendly <notifications@calendly.com> |

Observations:
- **Sender**: notifications@calendly.com with a verified (DMARC-aligned) domain; Gmail shows the blue check. Onboarding emails come from the same brand.
- **Subject patterns**: `New Event: {invitee} - {time} {date} - {event type}` for hosts; `Canceled: {event type} with {invitee} on {date}` for cancellations; invitee confirmations use a "Confirmed:" style.
- **Template**: centered Calendly logo, greeting "Hi {host},", a bordered event card (invitee, event date/time with timezone, canceled-by), primary buttons ("Add to Calendar", "View reservation"), footer "Sent from Calendly".
- **Smart card**: Gmail renders a calendar widget from schema.org Event markup embedded in the email ("Add to Calendar" button) — worth replicating with JSON-LD if deliverability tooling allows.
- **ESP**: not exposed in the Gmail UI; at Calendly's volume this is a dedicated transactional provider (SendGrid/SES/Postmark class) sending from a subdomain with SPF/DKIM/DMARC. Raw headers would confirm.

Calcal implementation mirrors this: `notifications@calcal.app`, "New Event: ..." / "Canceled: ..." / "Confirmed: ..." subjects, centered logo + event card + buttons, queued to an outbox and delivered via Resend when `RESEND_API_KEY` is set (pluggable to SES/Postmark).
