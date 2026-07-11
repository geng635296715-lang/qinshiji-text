import { randomUUID } from "node:crypto";
import { getDb } from "../../shared/db/sqlite.js";

export type ReminderSettings = {
  dailyEnabled: boolean;
  dailyTime: string;
  monthlyEnabled: boolean;
  monthlyDay: number;
  channel: "site" | "email" | "sms";
};

export type BaziArchiveProfile = {
  id: string;
  nickname: string;
  calendarType: string;
  birthDate: string;
  birthTime: string;
  gender: string;
  birthPlace: string;
  note: string | null;
  savedAt: string;
  updatedAt: string;
};

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  dailyEnabled: false,
  dailyTime: "08:30",
  monthlyEnabled: false,
  monthlyDay: 1,
  channel: "site"
};

function nowIso() {
  return new Date().toISOString();
}

function safeParseJson<T>(value: unknown, fallback: T) {
  if (typeof value !== "string" || !value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function upsertBaziProfileForUser(input: {
  userId: string;
  profile: {
    calendarType: string;
    birthDate: string;
    birthTime: string;
    gender: string;
    birthPlace: string;
    focusYear?: number;
    isVip?: boolean;
  };
  analysisSnapshot?: unknown;
}) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM bazi_profiles WHERE user_id = ?")
    .get(input.userId) as { id: string } | undefined;
  const now = nowIso();

  if (existing) {
    db.prepare(`
      UPDATE bazi_profiles
      SET
        calendar_type = ?,
        birth_date = ?,
        birth_time = ?,
        gender = ?,
        birth_place = ?,
        latest_focus_year = ?,
        is_vip = ?,
        analysis_snapshot = ?,
        updated_at = ?,
        saved_at = ?
      WHERE user_id = ?
    `).run(
      input.profile.calendarType,
      input.profile.birthDate,
      input.profile.birthTime,
      input.profile.gender,
      input.profile.birthPlace,
      input.profile.focusYear ?? null,
      input.profile.isVip ? 1 : 0,
      input.analysisSnapshot ? JSON.stringify(input.analysisSnapshot) : null,
      now,
      now,
      input.userId
    );
  } else {
    db.prepare(`
      INSERT INTO bazi_profiles (
        id, user_id, calendar_type, birth_date, birth_time, gender, birth_place,
        latest_focus_year, is_vip, analysis_snapshot, saved_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      input.userId,
      input.profile.calendarType,
      input.profile.birthDate,
      input.profile.birthTime,
      input.profile.gender,
      input.profile.birthPlace,
      input.profile.focusYear ?? null,
      input.profile.isVip ? 1 : 0,
      input.analysisSnapshot ? JSON.stringify(input.analysisSnapshot) : null,
      now,
      now
    );
  }
}

export function createBaziArchiveForUser(input: {
  userId: string;
  nickname: string;
  profile: {
    calendarType: string;
    birthDate: string;
    birthTime: string;
    gender: string;
    birthPlace: string;
    note?: string;
  };
}) {
  const db = getDb();
  const id = randomUUID();
  const now = nowIso();

  db.prepare(`
    INSERT INTO bazi_profile_archives (
      id, user_id, nickname, calendar_type, birth_date, birth_time, gender, birth_place, note, saved_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.userId,
    input.nickname,
    input.profile.calendarType,
    input.profile.birthDate,
    input.profile.birthTime,
    input.profile.gender,
    input.profile.birthPlace,
    input.profile.note?.trim() || null,
    now,
    now
  );

  return getBaziArchiveByIdForUser(input.userId, id);
}

export function updateBaziArchiveForUser(input: {
  userId: string;
  archiveId: string;
  nickname: string;
  profile: {
    calendarType: string;
    birthDate: string;
    birthTime: string;
    gender: string;
    birthPlace: string;
    note?: string;
  };
}) {
  const db = getDb();
  const now = nowIso();

  const result = db.prepare(`
    UPDATE bazi_profile_archives
    SET
      nickname = ?,
      calendar_type = ?,
      birth_date = ?,
      birth_time = ?,
      gender = ?,
      birth_place = ?,
      note = ?,
      updated_at = ?
    WHERE user_id = ? AND id = ?
  `).run(
    input.nickname,
    input.profile.calendarType,
    input.profile.birthDate,
    input.profile.birthTime,
    input.profile.gender,
    input.profile.birthPlace,
    input.profile.note?.trim() || null,
    now,
    input.userId,
    input.archiveId
  );

  if (result.changes === 0) {
    return null;
  }

  return getBaziArchiveByIdForUser(input.userId, input.archiveId);
}

export function deleteBaziArchiveForUser(userId: string, archiveId: string) {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM bazi_profile_archives
    WHERE user_id = ? AND id = ?
  `).run(userId, archiveId);

  return result.changes > 0;
}

export function listBaziArchivesForUser(userId: string) {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id, nickname, calendar_type, birth_date, birth_time, gender, birth_place, note, saved_at, updated_at
      FROM bazi_profile_archives
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `)
    .all(userId) as Array<Record<string, unknown>>;

  return rows.map(mapBaziArchiveRow);
}

export function getBaziArchiveByIdForUser(userId: string, archiveId: string) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT id, nickname, calendar_type, birth_date, birth_time, gender, birth_place, note, saved_at, updated_at
      FROM bazi_profile_archives
      WHERE user_id = ? AND id = ?
    `)
    .get(userId, archiveId) as Record<string, unknown> | undefined;

  return row ? mapBaziArchiveRow(row) : null;
}

function mapBaziArchiveRow(row: Record<string, unknown>): BaziArchiveProfile {
  return {
    id: String(row.id),
    nickname: String(row.nickname),
    calendarType: String(row.calendar_type),
    birthDate: String(row.birth_date),
    birthTime: String(row.birth_time),
    gender: String(row.gender),
    birthPlace: String(row.birth_place),
    note: row.note ? String(row.note) : null,
    savedAt: String(row.saved_at),
    updatedAt: String(row.updated_at)
  };
}

export function saveDivinationRecordForUser(input: {
  userId: string;
  method: "liuyao" | "meihua";
  topic: string;
  title: string;
  description?: string;
  requestPayload: unknown;
  resultPayload: unknown;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO divination_records (
      id, user_id, method, topic, title, description, input_json, result_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    input.userId,
    input.method,
    input.topic,
    input.title,
    input.description ?? null,
    JSON.stringify(input.requestPayload),
    JSON.stringify(input.resultPayload),
    nowIso()
  );
}

export function saveAiConsultationRecordForUser(input: {
  userId: string;
  module: string;
  sessionId: string;
  question: string;
  answer: string;
  model?: string;
  context: unknown;
  history?: unknown;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO ai_consultation_records (
      id, user_id, module, session_id, question, answer, model, context_json, history_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    input.userId,
    input.module,
    input.sessionId,
    input.question,
    input.answer,
    input.model ?? null,
    JSON.stringify(input.context ?? {}),
    input.history ? JSON.stringify(input.history) : null,
    nowIso()
  );
}

export function saveReminderSettingsForUser(userId: string, reminderSettings: ReminderSettings) {
  const db = getDb();
  const existing = db
    .prepare("SELECT user_id FROM user_preferences WHERE user_id = ?")
    .get(userId) as { user_id: string } | undefined;
  const now = nowIso();

  if (existing) {
    db.prepare(`
      UPDATE user_preferences
      SET reminder_settings = ?, updated_at = ?
      WHERE user_id = ?
    `).run(JSON.stringify(reminderSettings), now, userId);
  } else {
    db.prepare(`
      INSERT INTO user_preferences (user_id, reminder_settings, updated_at)
      VALUES (?, ?, ?)
    `).run(userId, JSON.stringify(reminderSettings), now);
  }

  return reminderSettings;
}

export function getReminderSettingsForUser(userId: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT reminder_settings FROM user_preferences WHERE user_id = ?")
    .get(userId) as { reminder_settings: string | null } | undefined;

  return safeParseJson<ReminderSettings>(row?.reminder_settings, DEFAULT_REMINDER_SETTINGS);
}

export function getUserCenterOverview(userId: string) {
  const db = getDb();

  const profileRow = db.prepare("SELECT * FROM bazi_profiles WHERE user_id = ?").get(userId) as
    | Record<string, unknown>
    | undefined;
  const divinationRows = db
    .prepare(`
      SELECT id, method, topic, title, description, created_at, input_json
      FROM divination_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `)
    .all(userId) as Array<Record<string, unknown>>;
  const aiRows = db
    .prepare(`
      SELECT id, module, session_id, question, answer, model, created_at
      FROM ai_consultation_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `)
    .all(userId) as Array<Record<string, unknown>>;
  const qingzhiStateRow = db
    .prepare(`
      SELECT last_generated_at, last_advice_scope, last_advice_date, last_result_json
      FROM qingzhi_advice_state
      WHERE user_id = ?
    `)
    .get(userId) as
    | {
        last_generated_at: string | null;
        last_advice_scope: string | null;
        last_advice_date: string | null;
        last_result_json: string | null;
      }
    | undefined;
  const qingzhiResult = safeParseJson<Record<string, unknown> | null>(qingzhiStateRow?.last_result_json, null);

  return {
    latestBaziProfile: profileRow
      ? {
          id: String(profileRow.id),
          calendarType: String(profileRow.calendar_type),
          birthDate: String(profileRow.birth_date),
          birthTime: String(profileRow.birth_time),
          gender: String(profileRow.gender),
          birthPlace: String(profileRow.birth_place),
          focusYear: profileRow.latest_focus_year ? Number(profileRow.latest_focus_year) : null,
          isVip: Boolean(profileRow.is_vip),
          analysisSnapshot: safeParseJson(profileRow.analysis_snapshot, null),
          savedAt: String(profileRow.saved_at),
          updatedAt: String(profileRow.updated_at)
        }
      : null,
    reminderSettings: getReminderSettingsForUser(userId),
    baziArchives: listBaziArchivesForUser(userId),
    latestQingzhiAdvice: qingzhiStateRow
      ? {
          lastGeneratedAt: qingzhiStateRow.last_generated_at,
          lastAdviceScope: qingzhiStateRow.last_advice_scope,
          lastAdviceDate: qingzhiStateRow.last_advice_date,
          score:
            qingzhiResult &&
            typeof qingzhiResult === "object" &&
            qingzhiResult.advice &&
            typeof qingzhiResult.advice === "object" &&
            "score" in qingzhiResult.advice
              ? Number((qingzhiResult.advice as Record<string, unknown>).score)
              : null,
          summary:
            qingzhiResult &&
            typeof qingzhiResult === "object" &&
            qingzhiResult.advice &&
            typeof qingzhiResult.advice === "object" &&
            "summary" in qingzhiResult.advice
              ? String((qingzhiResult.advice as Record<string, unknown>).summary)
              : null,
          keywords:
            qingzhiResult &&
            typeof qingzhiResult === "object" &&
            qingzhiResult.advice &&
            typeof qingzhiResult.advice === "object" &&
            "dailyKeywords" in qingzhiResult.advice
              ? safeParseJson<string[]>(
                  JSON.stringify((qingzhiResult.advice as Record<string, unknown>).dailyKeywords),
                  []
                )
              : [],
          resultSnapshot: qingzhiResult
        }
      : null,
    divinationHistory: divinationRows.map((row) => ({
      id: String(row.id),
      method: String(row.method),
      topic: String(row.topic),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      requestPayload: safeParseJson(row.input_json, {}),
      createdAt: String(row.created_at)
    })),
    aiConsultationHistory: aiRows.map((row) => ({
      id: String(row.id),
      module: String(row.module),
      sessionId: String(row.session_id),
      question: String(row.question),
      answer: String(row.answer),
      model: row.model ? String(row.model) : null,
      createdAt: String(row.created_at)
    }))
  };
}
