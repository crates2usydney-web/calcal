import { db } from "./db";
import { getAvailability, slotsForDay } from "./slots";
import { formatInTimeZone } from "date-fns-tz";

export type HostRef = { id: string; name: string; username: string; email: string; timezone: string };

const HOST_FIELDS = "u.id, u.name, u.username, u.email, u.timezone";

export function getUser(userId: string): HostRef | null {
  const row = db.prepare("SELECT " + HOST_FIELDS + " FROM users u WHERE u.id = ?").get(userId) as HostRef | undefined;
  return row ?? null;
}

export function getTeamMembers(ownerId: string): HostRef[] {
  const owner = getUser(ownerId);
  const members = db
    .prepare("SELECT " + HOST_FIELDS + " FROM team_members t JOIN users u ON u.id = t.member_id WHERE t.owner_id = ? ORDER BY t.created_at")
    .all(ownerId) as HostRef[];
  return owner ? [owner, ...members.filter((m) => m.id !== owner.id)] : members;
}

export function getEventHosts(eventTypeId: string, ownerId: string, assignment: string): HostRef[] {
  const owner = getUser(ownerId);
  if (!owner) return [];
  if (assignment !== "round_robin") return [owner];
  const rows = db
    .prepare("SELECT " + HOST_FIELDS + " FROM event_type_hosts h JOIN users u ON u.id = h.user_id WHERE h.event_type_id = ? ORDER BY h.position")
    .all(eventTypeId) as HostRef[];
  return rows.length ? rows : [owner];
}

export function setEventHosts(eventTypeId: string, hostIds: string[]) {
  db.prepare("DELETE FROM event_type_hosts WHERE event_type_id = ?").run(eventTypeId);
  const ins = db.prepare("INSERT OR IGNORE INTO event_type_hosts (event_type_id, user_id, position) VALUES (?, ?, ?)");
  hostIds.forEach((id, i) => ins.run(eventTypeId, id, i));
}

export type UnionSlot = { startISO: string; endISO: string; label: string; hostIds: string[] };

export function unionSlotsForDay(opts: { hosts: HostRef[]; dayISO: string; duration: number; displayTz: string }): UnionSlot[] {
  const map = new Map<string, UnionSlot>();
  for (const host of opts.hosts) {
    const slots = slotsForDay({
      userId: host.id,
      tz: host.timezone,
      dayISO: opts.dayISO,
      duration: opts.duration,
      availability: getAvailability(host.id),
    });
    for (const s of slots) {
      const existing = map.get(s.startISO);
      if (existing) existing.hostIds.push(host.id);
      else
        map.set(s.startISO, {
          startISO: s.startISO,
          endISO: s.endISO,
          label: formatInTimeZone(new Date(s.startISO), opts.displayTz, "h:mmaaa"),
          hostIds: [host.id],
        });
    }
  }
  return [...map.values()].sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export function pickHostForSlot(hostIds: string[], startISO: string, durationMin: number): string | null {
  const start = new Date(startISO).getTime();
  const end = start + durationMin * 60_000;
  const startISOEnd = new Date(end).toISOString();

  const free = hostIds.filter((id) => {
    const clash = db
      .prepare("SELECT 1 FROM bookings WHERE host_id = ? AND status = 'confirmed' AND start_utc < ? AND end_utc > ?")
      .get(id, startISOEnd, startISO);
    return !clash;
  });
  if (!free.length) return null;

  const now = new Date().toISOString();
  const scored = free.map((id) => {
    const row = db
      .prepare("SELECT COUNT(*) AS n FROM bookings WHERE host_id = ? AND status = 'confirmed' AND start_utc >= ?")
      .get(id, now) as { n: number };
    return { id, n: row.n };
  });
  scored.sort((a, b) => a.n - b.n);
  return scored[0].id;
}
