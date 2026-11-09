import { randomUUID } from "node:crypto";
import { db } from "./db";
import { canUseReminders } from "./plans";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM = process.env.MAIL_FROM || "calcal <notifications@calcal.app>";

export type EmailKind = "confirmation" | "host_notification" | "reminder" | "cancellation" | "test";

type BookingRow = {
  id: string;
  host_id: string;
  invitee_name: string;
  invitee_email: string;
  notes: string;
  start_utc: string;
  end_utc: string;
  title: string;
  duration: number;
  location: string;
  host_name: string;
  host_email: string;
  timezone: string;
  plan: string;
};

function getBooking(bookingId: string): BookingRow | null {
  const row = db
    .prepare(
      "SELECT b.id, b.host_id, b.invitee_name, b.invitee_email, b.notes, b.start_utc, b.end_utc, " +
      "e.title, e.duration, e.location, u.name AS host_name, u.email AS host_email, u.timezone, u.plan " +
      "FROM bookings b JOIN event_types e ON e.id = b.event_type_id JOIN users u ON u.id = b.host_id WHERE b.id = ?"
    )
    .get(bookingId) as BookingRow | undefined;
  return row ?? null;
}

export function fmtWhen(iso: string, tz: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: tz }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }),
  };
}

function layout(opts: { heading: string; intro: string; rows: [string, string][]; buttons: { label: string; href: string }[]; footer?: string }) {
  const rows = opts.rows
    .map(
      ([k, v]) =>
        '<tr><td style="padding:6px 0;color:#5b6b7c;font-size:13px;width:90px;vertical-align:top">' + k +
        '</td><td style="padding:6px 0;color:#0b3558;font-size:13px;font-weight:600">' + v + "</td></tr>"
    )
    .join("");
  const buttons = opts.buttons
    .map(
      (b) =>
        '<a href="' + b.href + '" style="display:inline-block;margin-right:8px;margin-top:14px;background:#0069ff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600">' + b.label + "</a>"
    )
    .join("");
  return '<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">' +
    '<div style="max-width:520px;margin:0 auto;padding:28px 16px">' +
    '<div style="text-align:center;padding:8px 0 18px"><span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#0069ff;vertical-align:middle"></span>' +
    '<span style="font-size:20px;font-weight:700;color:#0b3558;margin-left:8px;vertical-align:middle">calcal</span></div>' +
    '<div style="background:#fff;border:1px solid #e3e8ef;border-radius:14px;padding:26px">' +
    '<h1 style="margin:0 0 6px;font-size:19px;color:#0b3558">' + opts.heading + "</h1>" +
    '<p style="margin:0;color:#5b6b7c;font-size:13.5px;line-height:1.6">' + opts.intro + "</p>" +
    '<div style="margin-top:16px;border:1px solid #e3e8ef;border-radius:10px;padding:14px"><table style="width:100%;border-collapse:collapse">' + rows + "</table></div>" +
    "<div>" + buttons + "</div></div>" +
    '<p style="text-align:center;color:#8a99aa;font-size:11.5px;margin-top:16px">' +
    (opts.footer ?? "Powered by calcal · You are receiving this because a meeting was scheduled with you.") +
    "</p></div></body></html>";
}

function queue(opts: { userId: string; bookingId?: string; to: string; subject: string; text: string; html: string; kind: EmailKind; sendAt?: Date }) {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO emails (id, user_id, booking_id, to_email, subject, body_text, body_html, kind, status, send_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)"
  ).run(id, opts.userId, opts.bookingId ?? null, opts.to, opts.subject, opts.text, opts.html, opts.kind, (opts.sendAt ?? new Date()).toISOString(), new Date().toISOString());
  return id;
}

async function deliverOne(id: string): Promise<boolean> {
  const row = db.prepare("SELECT * FROM emails WHERE id = ?").get(id) as
    | { id: string; to_email: string; subject: string; body_html: string; body_text: string }
    | undefined;
  if (!row) return false;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [row.to_email], subject: row.subject, html: row.body_html, text: row.body_text }),
      });
      if (!res.ok) throw new Error("resend " + res.status);
    } catch (err) {
      db.prepare("UPDATE emails SET last_error = ? WHERE id = ?").run(String(err), id);
      return false;
    }
  }
  db.prepare("UPDATE emails SET status = 'sent', sent_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  return true;
}

export async function deliverDueEmails(limit = 50): Promise<{ sent: number; failed: number }> {
  const now = new Date().toISOString();
  const due = db
    .prepare("SELECT id FROM emails WHERE status = 'scheduled' AND send_at <= ? ORDER BY send_at LIMIT ?")
    .all(now, limit) as { id: string }[];
  let sent = 0;
  let failed = 0;
  for (const d of due) {
    const ok = await deliverOne(d.id);
    if (ok) sent++;
    else failed++;
  }
  return { sent, failed };
}

export async function sendBookingNotifications(bookingId: string): Promise<{ queued: number; reminders: boolean }> {
  const b = getBooking(bookingId);
  if (!b) return { queued: 0, reminders: false };
  const when = fmtWhen(b.start_utc, b.timezone);
  const end = fmtWhen(b.end_utc, b.timezone);
  const ics = APP_URL + "/api/ics/" + b.id;
  const view = APP_URL + "/booking/" + b.id;
  const baseRows: [string, string][] = [
    ["What", b.title],
    ["When", when.date + " · " + when.time + " – " + end.time + " (" + b.timezone + ")"],
    ["Who", b.host_name],
  ];
  if (b.location) baseRows.push(["Where", b.location]);

  queue({
    userId: b.host_id,
    bookingId: b.id,
    to: b.invitee_email,
    subject: "Confirmed: " + b.title + " with " + b.host_name + " on " + when.date,
    kind: "confirmation",
    text: "Hi " + b.invitee_name + ",\n\nYour meeting is confirmed.\n\n" +
      baseRows.map(([k, v]) => k + ": " + v).join("\n") + "\n\nAdd to calendar: " + ics + "\nView booking: " + view,
    html: layout({
      heading: "You are scheduled",
      intro: "Hi " + b.invitee_name + ", your meeting with " + b.host_name + " is confirmed.",
      rows: baseRows,
      buttons: [{ label: "Add to calendar", href: ics }, { label: "View booking", href: view }],
    }),
  });

  queue({
    userId: b.host_id,
    bookingId: b.id,
    to: b.host_email,
    subject: "New Event: " + b.invitee_name + " - " + when.time + " " + when.date + " - " + b.title,
    kind: "host_notification",
    text: "Hi " + b.host_name + ",\n\nA new meeting was booked.\n\n" +
      baseRows.map(([k, v]) => k + ": " + v).join("\n") + "\nInvitee: " + b.invitee_name + " (" + b.invitee_email + ")\n\nView: " + view,
    html: layout({
      heading: "New event booked",
      intro: "Hi " + b.host_name + ", " + b.invitee_name + " booked " + b.title + ".",
      rows: [...baseRows, ["Invitee", b.invitee_name + " (" + b.invitee_email + ")"]],
      buttons: [{ label: "View booking", href: view }],
    }),
  });

  let reminders = false;
  if (canUseReminders(b.plan)) {
    const start = new Date(b.start_utc).getTime();
    const targets = [start - 24 * 3600_000, start - 3600_000].filter((t) => t > Date.now() + 60_000);
    for (const t of targets) {
      queue({
        userId: b.host_id,
        bookingId: b.id,
        to: b.invitee_email,
        subject: "Reminder: " + b.title + " with " + b.host_name + " on " + when.date,
        kind: "reminder",
        sendAt: new Date(t),
        text: "Hi " + b.invitee_name + ",\n\nThis is a reminder for your meeting.\n\n" +
          baseRows.map(([k, v]) => k + ": " + v).join("\n") + "\n\nView: " + view,
        html: layout({
          heading: "Meeting reminder",
          intro: "Hi " + b.invitee_name + ", your meeting with " + b.host_name + " is coming up.",
          rows: baseRows,
          buttons: [{ label: "View booking", href: view }],
        }),
      });
      reminders = true;
    }
  }
  return { queued: 2, reminders };
}

export function sendCancellationNotifications(bookingId: string) {
  const b = getBooking(bookingId);
  if (!b) return;
  const when = fmtWhen(b.start_utc, b.timezone);
  const rows: [string, string][] = [
    ["What", b.title],
    ["When", when.date + " · " + when.time + " (" + b.timezone + ")"],
  ];
  const targets: [string, string][] = [
    [b.invitee_email, b.invitee_name],
    [b.host_email, b.host_name],
  ];
  for (const [to, who] of targets) {
    const other = who === b.host_name ? b.invitee_name : b.host_name;
    queue({
      userId: b.host_id,
      bookingId: b.id,
      to,
      kind: "cancellation",
      subject: "Canceled: " + b.title + " with " + other + " on " + when.date,
      text: "Hi " + who + ",\n\nThe event below has been canceled.\n\n" + rows.map(([k, v]) => k + ": " + v).join("\n"),
      html: layout({ heading: "Event canceled", intro: "Hi " + who + ", the event below has been canceled.", rows, buttons: [] }),
    });
  }
}

export function queueTestEmail(userId: string, to: string, name: string) {
  queue({
    userId,
    to,
    kind: "test",
    subject: "Test email from calcal",
    text: "Hi " + name + ",\n\nThis is a test email from your calcal workspace.",
    html: layout({ heading: "Test email", intro: "Hi " + name + ", this is a test email from your calcal workspace.", rows: [], buttons: [] }),
  });
}
