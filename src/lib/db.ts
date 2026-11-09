import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");
const DATA_DIR = path.dirname(DB_PATH);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function seed(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (count.n > 0) return;

  const userId = randomUUID();
  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, username, timezone, welcome_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    userId,
    "Sam Macneil",
    "sam@example.com",
    hashPassword("demo1234"),
    "sam",
    "America/New_York",
    "Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.",
    new Date().toISOString()
  );

  const eventId = randomUUID();
  db.prepare(
    "INSERT INTO event_types (id, user_id, title, slug, description, duration, location, color, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    eventId,
    userId,
    "30 Minute Meeting",
    "30min",
    "A focused 30 minute conversation.",
    30,
    "",
    "#7C3AED",
    1,
    new Date().toISOString()
  );

  const insertAvail = db.prepare(
    "INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)"
  );
  for (let d = 1; d <= 5; d++) insertAvail.run(userId, d, 9 * 60, 17 * 60);
}

function ensureDemoTeam(db: DatabaseSync) {
  const alex = db.prepare("SELECT id, plan FROM users WHERE username = 'alex'").get() as { id: string; plan: string } | undefined;
  if (!alex) return;
  if (alex.plan === "free") db.prepare("UPDATE users SET plan = 'teams' WHERE id = ?").run(alex.id);

  const makeHost = (username: string, name: string, email: string) => {
    let row = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as { id: string } | undefined;
    if (!row) {
      const id = randomUUID();
      db.prepare(
        "INSERT INTO users (id, name, email, password_hash, username, timezone, welcome_message, created_at, plan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'teams')"
      ).run(id, name, email, hashPassword("demo1234"), username, "America/New_York", "Hi! Pick a time that works for you.", new Date().toISOString());
      const ins = db.prepare("INSERT INTO availability (user_id, weekday, start_min, end_min) VALUES (?, ?, ?, ?)");
      for (let d = 1; d <= 5; d++) ins.run(id, d, 9 * 60, 17 * 60);
      row = { id };
    }
    db.prepare("INSERT OR IGNORE INTO team_members (owner_id, member_id, created_at) VALUES (?, ?, ?)").run(alex.id, row.id, new Date().toISOString());
    return row.id;
  };

  const jordan = makeHost("jordan", "Jordan Lee", "jordan@calcal.app");
  const priya = makeHost("priya", "Priya Shah", "priya@calcal.app");

  const existing = db.prepare("SELECT id FROM event_types WHERE user_id = ? AND assignment = 'round_robin' LIMIT 1").get(alex.id);
  if (!existing) {
    const eventId = randomUUID();
    db.prepare(
      "INSERT INTO event_types (id, user_id, title, slug, description, duration, location, color, active, created_at, assignment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'round_robin')"
    ).run(eventId, alex.id, "Team Intro Call", "team-intro", "A 30 minute intro call with our team — we rotate hosts so you get the earliest time.", 30, "Zoom", "#0EA5E9", new Date().toISOString());
    const insHost = db.prepare("INSERT OR IGNORE INTO event_type_hosts (event_type_id, user_id, position) VALUES (?, ?, ?)");
    [alex.id, jordan, priya].forEach((id, i) => insHost.run(eventId, id, i));
  }
}

function init(): DatabaseSync {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 8000;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      timezone TEXT NOT NULL DEFAULT 'America/New_York',
      welcome_message TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT 'free',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS event_types (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      duration INTEGER NOT NULL DEFAULT 30,
      location TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#7C3AED',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL,
      start_min INTEGER NOT NULL,
      end_min INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      event_type_id TEXT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
      host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invitee_name TEXT NOT NULL,
      invitee_email TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      start_utc TEXT NOT NULL,
      end_utc TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings(host_id, start_utc);
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      booking_id TEXT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_text TEXT NOT NULL,
      body_html TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      send_at TEXT NOT NULL,
      sent_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_emails_due ON emails(status, send_at);
    CREATE TABLE IF NOT EXISTS oauth_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      account_email TEXT NOT NULL DEFAULT '',
      access_token TEXT NOT NULL DEFAULT '',
      refresh_token TEXT NOT NULL DEFAULT '',
      expires_at TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      UNIQUE(user_id, provider)
    );
    CREATE TABLE IF NOT EXISTS calendar_busy (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'google-calendar',
      start_utc TEXT NOT NULL,
      end_utc TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'freebusy',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_busy_user ON calendar_busy(user_id, start_utc);
    CREATE TABLE IF NOT EXISTS integration_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      app_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'connected',
      mode TEXT NOT NULL DEFAULT 'demo',
      credentials TEXT NOT NULL DEFAULT '{}',
      connected_at TEXT NOT NULL,
      UNIQUE(user_id, app_id)
    );
    CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      secret TEXT NOT NULL,
      events TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      event TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      response_code INTEGER,
      last_error TEXT,
      next_attempt_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS team_members (
      owner_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (owner_id, member_id)
    );
    CREATE TABLE IF NOT EXISTS event_type_hosts (
      event_type_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (event_type_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS single_use_links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type_id TEXT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      duration INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS poll_options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      start_utc TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS poll_votes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routing_forms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      event_type_id TEXT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
      questions TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routing_submissions (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES routing_forms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      answers TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      revoked INTEGER NOT NULL DEFAULT 0
    );
  `);
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "plan")) {
    try {
      db.exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'");
    } catch (err) {
      if (!String(err).toLowerCase().includes("duplicate column")) throw err;
    }
  }
  const etCols = db.prepare("PRAGMA table_info(event_types)").all() as { name: string }[];
  if (!etCols.some((c) => c.name === "assignment")) {
    try {
      db.exec("ALTER TABLE event_types ADD COLUMN assignment TEXT NOT NULL DEFAULT 'solo'");
    } catch (err) {
      if (!String(err).toLowerCase().includes("duplicate column")) throw err;
    }
  }
  const etCols2 = db.prepare("PRAGMA table_info(event_types)").all() as { name: string }[];
  const addEtCol = (name: string, ddl: string) => {
    if (etCols2.some((c) => c.name === name)) return;
    try {
      db.exec("ALTER TABLE event_types ADD COLUMN " + ddl);
    } catch (err) {
      if (!String(err).toLowerCase().includes("duplicate column")) throw err;
    }
  };
  addEtCol("price_cents", "price_cents INTEGER NOT NULL DEFAULT 0");
  addEtCol("currency", "currency TEXT NOT NULL DEFAULT 'usd'");
  addEtCol("require_payment", "require_payment INTEGER NOT NULL DEFAULT 0");

  const bCols = db.prepare("PRAGMA table_info(bookings)").all() as { name: string }[];
  const addBCol = (name: string, ddl: string) => {
    if (bCols.some((c) => c.name === name)) return;
    try {
      db.exec("ALTER TABLE bookings ADD COLUMN " + ddl);
    } catch (err) {
      if (!String(err).toLowerCase().includes("duplicate column")) throw err;
    }
  };
  addBCol("payment_status", "payment_status TEXT NOT NULL DEFAULT 'not_required'");
  addBCol("stripe_session_id", "stripe_session_id TEXT");
  addBCol("amount_cents", "amount_cents INTEGER NOT NULL DEFAULT 0");
  addBCol("paid_at", "paid_at TEXT");
  const addTableCol = (table: string, name: string, ddl: string) => {
    const cols = db.prepare("PRAGMA table_info(" + table + ")").all() as { name: string }[];
    if (cols.some((c) => c.name === name)) return;
    try {
      db.exec("ALTER TABLE " + table + " ADD COLUMN " + ddl);
    } catch (err) {
      if (!String(err).toLowerCase().includes("duplicate column")) throw err;
    }
  };
  addTableCol("polls", "event_type_id", "event_type_id TEXT");
  addTableCol("polls", "booked_option_id", "booked_option_id TEXT");
  addTableCol("polls", "booked_booking_id", "booked_booking_id TEXT");
  addTableCol("routing_forms", "branch_rules", "branch_rules TEXT NOT NULL DEFAULT '[]'");
  addTableCol("routing_submissions", "routed_event_type_id", "routed_event_type_id TEXT");

  try {
    seed(db);
    ensureDemoTeam(db);
  } catch (err) {
    const n = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    if (n.n === 0) throw err;
  }
  return db;
}

const globalForDb = globalThis as unknown as { __calendlyDb?: DatabaseSync };

function getDb(): DatabaseSync {
  if (!globalForDb.__calendlyDb) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        globalForDb.__calendlyDb = init();
        break;
      } catch (err) {
        lastError = err;
        if (!String(err).toLowerCase().includes("locked")) throw err;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150 * (attempt + 1));
      }
    }
    if (!globalForDb.__calendlyDb) throw lastError;
  }
  return globalForDb.__calendlyDb;
}

// Lazy proxy: the database is initialised on first query, not at import,
// so build workers do not race on the SQLite file.
export const db = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
}) as DatabaseSync;