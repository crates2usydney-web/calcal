import { db } from "../db";

export function bookingEventPayload(bookingId: string) {
  const row = db
    .prepare(
      "SELECT b.id, b.start_utc, b.end_utc, b.status, b.invitee_name, b.invitee_email, b.notes, " +
      "e.id AS event_id, e.title, e.slug, e.duration, u.id AS owner_id, h.id AS host_id, h.name AS host_name, h.email AS host_email " +
      "FROM bookings b JOIN event_types e ON e.id = b.event_type_id JOIN users u ON u.id = e.user_id JOIN users h ON h.id = b.host_id " +
      "WHERE b.id = ?"
    )
    .get(bookingId) as
    | {
        id: string; start_utc: string; end_utc: string; status: string; invitee_name: string; invitee_email: string; notes: string;
        event_id: string; title: string; slug: string; duration: number; owner_id: string; host_id: string; host_name: string; host_email: string;
      }
    | undefined;
  if (!row) return null;
  return {
    ownerId: row.owner_id,
    payload: {
      booking_id: row.id,
      status: row.status,
      start: row.start_utc,
      end: row.end_utc,
      invitee: { name: row.invitee_name, email: row.invitee_email, notes: row.notes },
      host: { id: row.host_id, name: row.host_name, email: row.host_email },
      event_type: { id: row.event_id, title: row.title, slug: row.slug, duration: row.duration },
    },
  };
}
