import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "../db/sqlite.js";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}

function mapUser(row: Record<string, unknown>): AuthUser {
  return {
    id: String(row.id),
    email: String(row.email),
    username: String(row.username),
    displayName: row.display_name ? String(row.display_name) : null,
    isVip: Boolean(row.is_vip),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function registerUser(input: {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const now = nowIso();

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
    .get(email, username) as { id: string } | undefined;

  if (existing) {
    throw new Error("Email or username already exists");
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, display_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, username, hashPassword(input.password), input.displayName?.trim() || null, now, now);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown>;
  return mapUser(user);
}

export function loginUser(input: { account: string; password: string }) {
  const db = getDb();
  const account = input.account.trim().toLowerCase();
  const row = db
    .prepare(`
      SELECT
        users.*,
        COALESCE((SELECT is_vip FROM bazi_profiles WHERE user_id = users.id LIMIT 1), 0) AS is_vip
      FROM users
      WHERE email = ? OR username = ?
    `)
    .get(account, account) as (Record<string, unknown> & { password_hash: string }) | undefined;

  if (!row || !verifyPassword(input.password, String(row.password_hash))) {
    throw new Error("Invalid account or password");
  }

  const session = createSession(String(row.id));
  return {
    user: mapUser(row),
    session
  };
}

export function createSession(userId: string) {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const token = randomBytes(32).toString("hex");
  const sessionId = randomUUID();
  const nowText = now.toISOString();

  db.prepare(`
    INSERT INTO user_sessions (id, user_id, token, expires_at, created_at, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sessionId, userId, token, expiresAt, nowText, nowText);

  return {
    token,
    expiresAt
  };
}

export function getUserByToken(token: string) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT
        users.*,
        COALESCE((SELECT is_vip FROM bazi_profiles WHERE user_id = users.id LIMIT 1), 0) AS is_vip,
        user_sessions.id AS session_id,
        user_sessions.expires_at
      FROM user_sessions
      JOIN users ON users.id = user_sessions.user_id
      WHERE user_sessions.token = ?
    `)
    .get(token) as (Record<string, unknown> & { session_id: string; expires_at: string }) | undefined;

  if (!row) {
    return null;
  }

  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    db.prepare("DELETE FROM user_sessions WHERE id = ?").run(String(row.session_id));
    return null;
  }

  db.prepare("UPDATE user_sessions SET last_used_at = ? WHERE id = ?").run(nowIso(), String(row.session_id));
  return mapUser(row);
}

export function logoutByToken(token: string) {
  const db = getDb();
  db.prepare("DELETE FROM user_sessions WHERE token = ?").run(token);
}

export function getUserById(userId: string) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT
        users.*,
        COALESCE((SELECT is_vip FROM bazi_profiles WHERE user_id = users.id LIMIT 1), 0) AS is_vip
      FROM users
      WHERE users.id = ?
    `)
    .get(userId) as Record<string, unknown> | undefined;
  return row ? mapUser(row) : null;
}
