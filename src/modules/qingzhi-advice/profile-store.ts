import { getUserById } from "../../shared/auth/service.js";
import { getDb } from "../../shared/db/sqlite.js";
import {
  getReminderSettingsForUser,
  saveReminderSettingsForUser,
  type ReminderSettings,
  upsertBaziProfileForUser
} from "../user-center/service.js";
import type { QingzhiAdviceInput } from "./service.js";

export type QingzhiProfilePayload = QingzhiAdviceInput["profile"];
export type QingzhiReminderSettings = ReminderSettings;

export type QingzhiCenterRecord = {
  userId: string;
  displayName?: string;
  profile: QingzhiProfilePayload;
  reminderSettings: QingzhiReminderSettings;
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt?: string;
  lastAdviceScope?: QingzhiAdviceInput["scope"];
  lastAdviceDate?: string;
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

export async function getQingzhiCenterRecord(userId: string) {
  const db = getDb();
  const user = getUserById(userId);
  if (!user) {
    return null;
  }

  const profileRow = db
    .prepare(`
      SELECT user_id, calendar_type, birth_date, birth_time, gender, birth_place, saved_at, updated_at
      FROM bazi_profiles
      WHERE user_id = ?
    `)
    .get(userId) as
    | {
        user_id: string;
        calendar_type: string;
        birth_date: string;
        birth_time: string;
        gender: string;
        birth_place: string;
        saved_at: string;
        updated_at: string;
      }
    | undefined;

  if (!profileRow) {
    return null;
  }

  const adviceStateRow = db
    .prepare(`
      SELECT last_generated_at, last_advice_scope, last_advice_date
      FROM qingzhi_advice_state
      WHERE user_id = ?
    `)
    .get(userId) as
    | {
        last_generated_at: string | null;
        last_advice_scope: QingzhiAdviceInput["scope"] | null;
        last_advice_date: string | null;
      }
    | undefined;

  return {
    userId,
    displayName: user.displayName ?? user.username,
    profile: {
      calendarType: profileRow.calendar_type as QingzhiProfilePayload["calendarType"],
      birthDate: profileRow.birth_date,
      birthTime: profileRow.birth_time,
      gender: profileRow.gender as QingzhiProfilePayload["gender"],
      birthPlace: profileRow.birth_place
    },
    reminderSettings: getReminderSettingsForUser(userId),
    createdAt: profileRow.saved_at,
    updatedAt: profileRow.updated_at,
    lastGeneratedAt: adviceStateRow?.last_generated_at ?? undefined,
    lastAdviceScope: adviceStateRow?.last_advice_scope ?? undefined,
    lastAdviceDate: adviceStateRow?.last_advice_date ?? undefined
  };
}

export async function saveQingzhiCenterProfile(input: {
  userId: string;
  displayName?: string;
  profile: QingzhiProfilePayload;
}) {
  upsertBaziProfileForUser({
    userId: input.userId,
    profile: {
      ...input.profile,
      isVip: true
    }
  });

  return getQingzhiCenterRecord(input.userId);
}

export async function saveQingzhiReminderSettings(input: {
  userId: string;
  reminderSettings: QingzhiReminderSettings;
}) {
  saveReminderSettingsForUser(input.userId, input.reminderSettings);
  return getQingzhiCenterRecord(input.userId);
}

export async function markQingzhiAdviceGenerated(input: {
  userId: string;
  scope: QingzhiAdviceInput["scope"];
  date: string;
  result?: unknown;
}) {
  const db = getDb();
  const current = db
    .prepare("SELECT user_id FROM qingzhi_advice_state WHERE user_id = ?")
    .get(input.userId) as { user_id: string } | undefined;
  const now = nowIso();

  if (current) {
    db.prepare(`
      UPDATE qingzhi_advice_state
      SET
        last_generated_at = ?,
        last_advice_scope = ?,
        last_advice_date = ?,
        last_result_json = ?,
        updated_at = ?
      WHERE user_id = ?
    `).run(
      now,
      input.scope,
      input.date,
      input.result ? JSON.stringify(input.result) : null,
      now,
      input.userId
    );
  } else {
    db.prepare(`
      INSERT INTO qingzhi_advice_state (
        user_id, last_generated_at, last_advice_scope, last_advice_date, last_result_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(input.userId, now, input.scope, input.date, input.result ? JSON.stringify(input.result) : null, now);
  }

  return getQingzhiCenterRecord(input.userId);
}

export async function getLastQingzhiAdviceResult(userId: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT last_result_json FROM qingzhi_advice_state WHERE user_id = ?")
    .get(userId) as { last_result_json: string | null } | undefined;

  return safeParseJson(row?.last_result_json, null);
}

export function buildReminderPreview(record: QingzhiCenterRecord | null) {
  if (!record) {
    return {
      enabled: false,
      items: [],
      summary: "当前还没有可用的提醒档案。"
    };
  }

  const items: string[] = [];
  if (record.reminderSettings.dailyEnabled) {
    items.push(`每日提醒：每天 ${record.reminderSettings.dailyTime}`);
  }
  if (record.reminderSettings.monthlyEnabled) {
    items.push(`每月提醒：每月 ${record.reminderSettings.monthlyDay} 日`);
  }

  return {
    enabled: items.length > 0,
    items,
    summary:
      items.length > 0
        ? `已保存 ${items.length} 项提醒设置，后续可直接接入站内推送、短信或邮件。`
        : "暂未开启每日或每月提醒。"
  };
}
