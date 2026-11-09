export type ProviderMode = "live" | "demo" | "off";

export type ProviderStatus = {
  id: string;
  name: string;
  purpose: string;
  env: string[];
  mode: ProviderMode;
  detail: string;
  manageHref: string;
  manageLabel: string;
};

const hasAll = (...keys: string[]) => keys.every((k) => Boolean(process.env[k]));
const hasAny = (...keys: string[]) => keys.some((k) => Boolean(process.env[k]));

export function providerStatuses(): ProviderStatus[] {
  const stripe = hasAll("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");
  const stripePartial = hasAny("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET") && !stripe;

  const google = hasAll("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");
  const googlePartial = hasAny("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET") && !google;

  const resend = Boolean(process.env.RESEND_API_KEY);
  const cron = Boolean(process.env.CRON_SECRET);

  return [
    {
      id: "stripe",
      name: "Stripe Checkout",
      purpose: "Charge invitees when they book a paid event type.",
      env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      mode: stripe ? "live" : "demo",
      detail: stripe
        ? "Live card payments enabled. Checkout sessions are created and the webhook confirms payment."
        : stripePartial
        ? "Only one of the two Stripe keys is set. Add both to enable real checkout."
        : "Demo payments only — the pay page marks bookings paid without charging a card.",
      manageHref: "/dashboard/event-types",
      manageLabel: "Paid event types",
    },
    {
      id: "google",
      name: "Google Calendar",
      purpose: "Read busy times and block conflicting slots.",
      env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      mode: google ? "live" : "demo",
      detail: google
        ? "Live OAuth enabled. Connect Google Calendar from Integrations to sync busy times."
        : googlePartial
        ? "Only one Google credential is set. Add both to enable real OAuth."
        : "Demo mode only — connecting generates synthetic busy blocks instead of reading a real calendar.",
      manageHref: "/dashboard/integrations/google-calendar",
      manageLabel: "Google Calendar",
    },
    {
      id: "resend",
      name: "Email delivery (Resend)",
      purpose: "Send confirmations, cancellations and reminders for real.",
      env: ["RESEND_API_KEY", "MAIL_FROM"],
      mode: resend ? "live" : "demo",
      detail: resend
        ? "Live delivery enabled. Emails are sent through Resend and tracked in the outbox."
        : "Outbox only — emails are queued and marked sent in the dev transport, but never leave the server.",
      manageHref: "/dashboard/emails",
      manageLabel: "Email outbox",
    },
    {
      id: "cron",
      name: "Reminder scheduler",
      purpose: "Runs due reminders via POST /api/cron/reminders.",
      env: ["CRON_SECRET"],
      mode: cron ? "live" : "off",
      detail: cron
        ? "Cron endpoint is protected by a bearer secret. Point a scheduler (Render Cron Job, GitHub Actions, cron-job.org) at it every minute."
        : "No CRON_SECRET set — the reminder endpoint is not protected and no scheduler should call it.",
      manageHref: "/dashboard/emails",
      manageLabel: "Reminders",
    },
    {
      id: "appurl",
      name: "Public app URL",
      purpose: "Used for booking links, OAuth redirects and Stripe return URLs.",
      env: ["APP_URL"],
      mode: "live",
      detail: (process.env.APP_URL || "http://localhost:3000") + (process.env.APP_URL ? "" : " (default — set APP_URL in production)"),
      manageHref: "/dashboard/settings",
      manageLabel: "Settings",
    },
  ];
}
