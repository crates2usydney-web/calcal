export type IntegrationAuth = "oauth" | "api_key" | "webhook" | "ics" | "smtp";

export type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  auth: IntegrationAuth;
  popular?: boolean;
};

export const CATEGORIES = [
  "Calendars",
  "Video conferencing",
  "CRM",
  "Payments",
  "Marketing",
  "Automation",
  "Productivity",
  "Analytics",
  "Support",
  "AI",
  "Messaging",
] as const;

export const INTEGRATIONS: Integration[] = [
  { id: "google-calendar", name: "Google Calendar", category: "Calendars", description: "Two-way sync, conflict checks and event creation.", auth: "oauth", popular: true },
  { id: "outlook-calendar", name: "Outlook Calendar", category: "Calendars", description: "Microsoft 365 calendar sync and free/busy.", auth: "oauth", popular: true },
  { id: "microsoft-365", name: "Microsoft 365", category: "Calendars", description: "Exchange Online calendars and rooms.", auth: "oauth" },
  { id: "apple-calendar", name: "Apple Calendar", category: "Calendars", description: "Subscribe via ICS feed.", auth: "ics" },
  { id: "caldav", name: "CalDAV", category: "Calendars", description: "Connect any CalDAV-compatible calendar.", auth: "api_key" },
  { id: "zoom", name: "Zoom", category: "Video conferencing", description: "Auto-create Zoom links on booking.", auth: "oauth", popular: true },
  { id: "google-meet", name: "Google Meet", category: "Video conferencing", description: "Generate Meet links from Google Calendar.", auth: "oauth", popular: true },
  { id: "microsoft-teams", name: "Microsoft Teams", category: "Video conferencing", description: "Teams meeting links for bookings.", auth: "oauth" },
  { id: "webex", name: "Webex", category: "Video conferencing", description: "Create Webex meetings automatically.", auth: "oauth" },
  { id: "whereby", name: "Whereby", category: "Video conferencing", description: "Browser-based meeting rooms.", auth: "api_key" },
  { id: "around", name: "Around", category: "Video conferencing", description: "Floating video rooms.", auth: "api_key" },
  { id: "salesforce", name: "Salesforce", category: "CRM", description: "Sync leads, contacts and meeting activity.", auth: "oauth", popular: true },
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Create contacts and log meetings.", auth: "oauth", popular: true },
  { id: "pipedrive", name: "Pipedrive", category: "CRM", description: "Push bookings to deals and contacts.", auth: "api_key" },
  { id: "zoho-crm", name: "Zoho CRM", category: "CRM", description: "Sync contacts and activities.", auth: "oauth" },
  { id: "dynamics", name: "Microsoft Dynamics 365", category: "CRM", description: "Enterprise CRM sync and routing.", auth: "oauth" },
  { id: "close", name: "Close", category: "CRM", description: "Log calls and meetings on leads.", auth: "api_key" },
  { id: "copper", name: "Copper", category: "CRM", description: "Sync people and opportunities.", auth: "api_key" },
  { id: "stripe", name: "Stripe", category: "Payments", description: "Charge deposits and full payments at booking.", auth: "api_key", popular: true },
  { id: "paypal", name: "PayPal", category: "Payments", description: "Collect payments via PayPal.", auth: "oauth" },
  { id: "square", name: "Square", category: "Payments", description: "In-person and online payments.", auth: "oauth" },
  { id: "razorpay", name: "Razorpay", category: "Payments", description: "Payments for India and SEA.", auth: "api_key" },
  { id: "wise", name: "Wise", category: "Payments", description: "International transfers and invoices.", auth: "api_key" },
  { id: "mailchimp", name: "Mailchimp", category: "Marketing", description: "Add invitees to audiences and journeys.", auth: "oauth", popular: true },
  { id: "marketo", name: "Marketo", category: "Marketing", description: "Sync event data into campaigns.", auth: "oauth" },
  { id: "pardot", name: "Pardot", category: "Marketing", description: "Route and score leads from forms.", auth: "oauth" },
  { id: "klaviyo", name: "Klaviyo", category: "Marketing", description: "Trigger email flows from bookings.", auth: "api_key" },
  { id: "activecampaign", name: "ActiveCampaign", category: "Marketing", description: "Automate follow-ups and tags.", auth: "api_key" },
  { id: "convertkit", name: "ConvertKit", category: "Marketing", description: "Add invitees to sequences.", auth: "api_key" },
  { id: "zapier", name: "Zapier", category: "Automation", description: "Connect 6,000+ apps with Zaps and webhooks.", auth: "webhook", popular: true },
  { id: "make", name: "Make", category: "Automation", description: "Visual automations and scenarios.", auth: "webhook" },
  { id: "n8n", name: "n8n", category: "Automation", description: "Self-hosted workflow automation.", auth: "webhook" },
  { id: "ifttt", name: "IFTTT", category: "Automation", description: "Simple if-this-then-that recipes.", auth: "webhook" },
  { id: "workato", name: "Workato", category: "Automation", description: "Enterprise automation platform.", auth: "api_key" },
  { id: "pabbly", name: "Pabbly Connect", category: "Automation", description: "Affordable Zapier alternative.", auth: "webhook" },
  { id: "slack", name: "Slack", category: "Productivity", description: "Post new bookings to channels.", auth: "oauth", popular: true },
  { id: "notion", name: "Notion", category: "Productivity", description: "Create meeting notes pages.", auth: "api_key" },
  { id: "airtable", name: "Airtable", category: "Productivity", description: "Log bookings in a base.", auth: "api_key" },
  { id: "trello", name: "Trello", category: "Productivity", description: "Create cards for new meetings.", auth: "api_key" },
  { id: "asana", name: "Asana", category: "Productivity", description: "Turn meetings into tasks.", auth: "oauth" },
  { id: "clickup", name: "ClickUp", category: "Productivity", description: "Create tasks in spaces.", auth: "api_key" },
  { id: "monday", name: "monday.com", category: "Productivity", description: "Add items to boards.", auth: "api_key" },
  { id: "jira", name: "Jira", category: "Productivity", description: "Create issues from meetings.", auth: "oauth" },
  { id: "linear", name: "Linear", category: "Productivity", description: "File issues from action items.", auth: "api_key" },
  { id: "google-analytics", name: "Google Analytics", category: "Analytics", description: "Track booking conversions.", auth: "api_key" },
  { id: "meta-pixel", name: "Meta Pixel", category: "Analytics", description: "Conversion tracking for ads.", auth: "api_key" },
  { id: "mixpanel", name: "Mixpanel", category: "Analytics", description: "Product analytics events.", auth: "api_key" },
  { id: "segment", name: "Segment", category: "Analytics", description: "Fan out booking events.", auth: "api_key" },
  { id: "amplitude", name: "Amplitude", category: "Analytics", description: "Behavioral analytics.", auth: "api_key" },
  { id: "posthog", name: "PostHog", category: "Analytics", description: "Open-source product analytics.", auth: "api_key" },
  { id: "intercom", name: "Intercom", category: "Support", description: "Create conversations from bookings.", auth: "oauth" },
  { id: "zendesk", name: "Zendesk", category: "Support", description: "Open tickets for meeting requests.", auth: "api_key" },
  { id: "freshdesk", name: "Freshdesk", category: "Support", description: "Sync contacts and tickets.", auth: "api_key" },
  { id: "drift", name: "Drift", category: "Support", description: "Route chat leads to booking.", auth: "api_key" },
  { id: "openai", name: "OpenAI", category: "AI", description: "Draft follow-ups and summaries.", auth: "api_key" },
  { id: "anthropic", name: "Anthropic", category: "AI", description: "Claude-powered meeting prep.", auth: "api_key" },
  { id: "gemini", name: "Google Gemini", category: "AI", description: "Summarise and prep meetings.", auth: "api_key" },
  { id: "perplexity", name: "Perplexity", category: "AI", description: "Research invitees before calls.", auth: "api_key" },
  { id: "gmail", name: "Gmail", category: "Messaging", description: "Send confirmations from your own inbox.", auth: "oauth" },
  { id: "outlook-mail", name: "Outlook Mail", category: "Messaging", description: "Send from Microsoft 365.", auth: "oauth" },
  { id: "twilio", name: "Twilio SMS", category: "Messaging", description: "Text reminders to invitees.", auth: "api_key" },
  { id: "whatsapp", name: "WhatsApp", category: "Messaging", description: "WhatsApp reminders via Cloud API.", auth: "api_key" },
  { id: "telegram", name: "Telegram", category: "Messaging", description: "Bot notifications for new bookings.", auth: "api_key" },
  { id: "smtp", name: "Custom SMTP", category: "Messaging", description: "Send email through your own server.", auth: "smtp" },
  { id: "webhooks", name: "Webhooks", category: "Automation", description: "POST every booking event to your endpoint.", auth: "webhook", popular: true },
];

export function getIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}
