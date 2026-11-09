// Render Cron Job entrypoint: pings the reminder scheduler on the web service.
const base = process.env.APP_URL || "https://calcal-yzv8.onrender.com";
const secret = process.env.CRON_SECRET || "";

const res = await fetch(base.replace(/\/$/, "") + "/api/cron/reminders", {
  headers: { Authorization: "Bearer " + secret },
});
const body = await res.text();
console.log(new Date().toISOString(), res.status, body);
if (!res.ok) process.exit(1);
