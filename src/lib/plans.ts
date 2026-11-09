export type Plan = {
  id: string;
  name: string;
  monthly: string;
  annual: string;
  note: string;
  cta: string;
  highlight?: boolean;
  blurb: string;
  items: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthly: "$0",
    annual: "$0",
    note: "Always free",
    cta: "Get started",
    blurb: "Personal scheduling that actually works.",
    items: ["3 event types", "1 calendar connection", "Unlimited 1:1 meetings", "Booking page & polls"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: "$8",
    annual: "$6",
    note: "per seat/mo · billed yearly",
    cta: "Start free trial",
    highlight: true,
    blurb: "Unlimited scheduling with reminders and payments.",
    items: ["Unlimited event types", "6 calendars", "Reminders & workflows", "Payments & integrations"],
  },
  {
    id: "teams",
    name: "Teams",
    monthly: "$14",
    annual: "$11",
    note: "per seat/mo · billed yearly",
    cta: "Start free trial",
    blurb: "Round-robin and routing for teams.",
    items: ["Everything in Pro", "Round robin & collective", "Routing forms", "Groups & admins"],
  },
  {
    id: "business",
    name: "Business",
    monthly: "$24",
    annual: "$19",
    note: "per seat/mo · billed yearly",
    cta: "Talk to sales",
    blurb: "Security and control at scale.",
    items: ["Everything in Teams", "SSO & SAML", "Audit log & data-deletion API", "Priority support"],
  },
];

export const PLAN_ORDER = ["free", "pro", "teams", "business"];

export function planRank(id: string): number {
  return Math.max(0, PLAN_ORDER.indexOf(id));
}

export function planAtLeast(plan: string, minimum: string): boolean {
  return planRank(plan) >= planRank(minimum);
}

export function eventTypeLimit(plan: string): number {
  return plan === "free" ? 3 : Infinity;
}

export function canAddEventType(plan: string, count: number): boolean {
  return count < eventTypeLimit(plan);
}

export function canUseReminders(plan: string): boolean {
  return planAtLeast(plan, "pro");
}

export function canUsePayments(plan: string): boolean {
  return planAtLeast(plan, "pro");
}

export function canUseRoundRobin(plan: string): boolean {
  return planAtLeast(plan, "teams");
}

export function canUseTeams(plan: string): boolean {
  return planAtLeast(plan, "teams");
}

export function canUseApi(plan: string): boolean {
  return true;
}

// values: Free | Pro | Teams | Business
// "+" included, "-" not included
export type Row = { label: string; values: [string, string, string, string] };
export type Group = { name: string; rows: Row[] };

export const COMPARISON: Group[] = [
  {
    name: "Scheduling",
    rows: [
      { label: "One-on-one meetings", values: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Event types", values: ["3", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Calendar connections", values: ["1", "6", "6", "6"] },
      { label: "Multi-person meeting types", values: ["-", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Round-robin distribution", values: ["-", "-", "Unlimited", "Unlimited"] },
      { label: "Book on behalf of others", values: ["-", "+", "+", "+"] },
      { label: "Automated email reminders", values: ["-", "+", "+", "+"] },
      { label: "Automated outreach", values: ["-", "+", "+", "+"] },
      { label: "Cancellation policy", values: ["-", "+", "+", "+"] },
      { label: "Routing forms / lead screening", values: ["-", "-", "+", "+"] },
      { label: "Single-use links", values: ["-", "+", "+", "+"] },
      { label: "Polls & one-off meetings", values: ["+", "+", "+", "+"] },
    ],
  },
  {
    name: "Payments",
    rows: [
      { label: "Collect payments at booking", values: ["-", "+", "+", "+"] },
      { label: "Payment links, packages, invoices", values: ["-", "+", "+", "+"] },
      { label: "Custom terms, discounts, coupons", values: ["-", "+", "+", "+"] },
    ],
  },
  {
    name: "Automations & integrations",
    rows: [
      { label: "HubSpot, Mailchimp, Zapier", values: ["-", "+", "+", "+"] },
      { label: "Google Analytics + Meta Pixel", values: ["-", "+", "+", "+"] },
      { label: "Gmail / Outlook workflows", values: ["-", "+", "+", "+"] },
      { label: "Salesforce CRM updates", values: ["-", "-", "+", "+"] },
      { label: "Custom webhooks", values: ["-", "+", "+", "+"] },
      { label: "REST API access", values: ["+", "+", "+", "+"] },
    ],
  },
  {
    name: "Personalization",
    rows: [
      { label: "Custom branding on booking page", values: ["+", "+", "+", "+"] },
      { label: "Remove calcal branding", values: ["-", "+", "+", "+"] },
      { label: "Embed color customization", values: ["-", "+", "+", "+"] },
      { label: "Custom confirmation pages", values: ["-", "+", "+", "+"] },
    ],
  },
  {
    name: "Admin & security",
    rows: [
      { label: "Team analytics", values: ["-", "+", "+", "+"] },
      { label: "Groups & admins", values: ["-", "-", "+", "+"] },
      { label: "Admin-managed events", values: ["-", "-", "+", "+"] },
      { label: "SAML SSO", values: ["-", "-", "-", "+"] },
      { label: "Audit log", values: ["-", "-", "-", "+"] },
      { label: "Domain control", values: ["-", "-", "-", "+"] },
      { label: "Data deletion API", values: ["-", "-", "-", "+"] },
    ],
  },
  {
    name: "Support",
    rows: [
      { label: "Help center & community", values: ["+", "+", "+", "+"] },
      { label: "24/7 email support", values: ["+", "+", "+", "+"] },
      { label: "24/7 chat support", values: ["-", "+", "+", "+"] },
      { label: "Phone support", values: ["-", "-", "-", "+"] },
      { label: "Dedicated support & onboarding", values: ["-", "-", "-", "+"] },
    ],
  },
];