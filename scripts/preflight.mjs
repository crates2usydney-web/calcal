#!/usr/bin/env node
const required = ["APP_URL", "APP_SECRET", "DATABASE_PATH"];
const recommended = ["CRON_SECRET", "RESEND_API_KEY", "STRIPE_SECRET_KEY", "GOOGLE_CLIENT_ID"];

const issues = [];
for (const key of required) if (!process.env[key]) issues.push("missing " + key);
if (process.env.APP_SECRET && process.env.APP_SECRET.length < 16) issues.push("APP_SECRET too short (<16 chars)");
if (process.env.APP_URL && !process.env.APP_URL.startsWith("https://") && process.env.NODE_ENV === "production") {
  issues.push("APP_URL should be https:// in production");
}

const base = process.env.APP_URL || "http://localhost:3000";
console.log("calcal preflight");
console.log("  APP_URL:", base);
console.log("  DATABASE_PATH:", process.env.DATABASE_PATH || "(default ./data/app.db)");
console.log("  OAuth redirect:", base + "/api/integrations/google-calendar/callback");
console.log("  Stripe webhook:", base + "/api/stripe/webhook");
console.log("  Reminder cron:", "POST " + base + "/api/cron/reminders");

for (const key of recommended) {
  console.log("  " + key + ":", process.env[key] ? "set" : "not set (optional)");
}

if (issues.length) {
  console.error("\nIssues:");
  for (const issue of issues) console.error("  - " + issue);
  process.exit(1);
}
console.log("\nEnvironment looks good.");
