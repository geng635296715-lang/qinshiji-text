import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.resolve(__dirname, "../../../data/qinshiji.db");
const databasePath = env.DATABASE_URL || defaultDbPath;

let dbInstance: Database.Database | null = null;

function runMigrations(db: Database.Database) {
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bazi_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      calendar_type TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL,
      gender TEXT NOT NULL,
      birth_place TEXT NOT NULL,
      latest_focus_year INTEGER,
      is_vip INTEGER NOT NULL DEFAULT 0,
      analysis_snapshot TEXT,
      saved_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bazi_profile_archives (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      calendar_type TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL,
      gender TEXT NOT NULL,
      birth_place TEXT NOT NULL,
      note TEXT,
      saved_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      reminder_settings TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS divination_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      method TEXT NOT NULL,
      topic TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_consultation_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module TEXT NOT NULL,
      session_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      model TEXT,
      context_json TEXT NOT NULL,
      history_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qingzhi_advice_state (
      user_id TEXT PRIMARY KEY,
      last_generated_at TEXT,
      last_advice_scope TEXT,
      last_advice_date TEXT,
      last_result_json TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_bazi_archives_user_updated ON bazi_profile_archives(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_divination_user_created ON divination_records(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_user_created ON ai_consultation_records(user_id, created_at DESC);
  `);
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  mkdirSync(path.dirname(databasePath), { recursive: true });
  dbInstance = new Database(databasePath);
  runMigrations(dbInstance);
  return dbInstance;
}
