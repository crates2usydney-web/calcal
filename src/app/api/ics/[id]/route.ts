import { db } from "@/lib/db";

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = db
    .prepare(
      `SELECT b.*, e.title, e.location, u.name AS host_name, u.email AS host_email
       FROM bookings b JOIN event_types e ON e.id = b.event_type_id JOIN users u ON u.id = b.host_id WHERE b.id = ?`
    )
    .get(id) as
    | { id: string; title: string; location: string; invitee_name: string; invitee_email: string; notes: string;
        start_utc: string; end_utc: string; host_name: string; host_email: string }
    | undefined;
  if (!b) return new Response("Not found", { status: 404 });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//calcal//EN",
    "BEGIN:VEVENT",
    "UID:" + b.id + "@calcal",
    "DTSTAMP:" + stamp(new Date()),
    "DTSTART:" + stamp(new Date(b.start_utc)),
    "DTEND:" + stamp(new Date(b.end_utc)),
    "SUMMARY:" + b.title,
    "DESCRIPTION:" + (b.notes || "").replace(/\n/g, "\\n"),
    "LOCATION:" + (b.location || ""),
    "ORGANIZER;CN=" + b.host_name + ":mailto:" + b.host_email,
    "ATTENDEE;CN=" + b.invitee_name + ":mailto:" + b.invitee_email,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="invite.ics"',
    },
  });
}
