import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { QingzhiAdviceInput } from "./service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data");
const STORE_PATH = path.join(DATA_DIR, "qingzhi-center.json");

export type QingzhiProfilePayload = QingzhiAdviceInput["profile"];

export type QingzhiReminderSettings = {
  dailyEnabled: boolean;
  dailyTime: string;
  monthlyEnabled: boolean;
  monthlyDay: number;
  channel: "site" | "email" | "sms";
};

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

type QingzhiStore = {
  users: Record<string, QingzhiCenterRecord>;
};

const DEFAULT_REMINDER_SETTINGS: QingzhiReminderSettings = {
  dailyEnabled: false,
  dailyTime: "08:30",
  monthlyEnabled: false,
  monthlyDay: 1,
  channel: "site"
};

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    const initial: QingzhiStore = { users: {} };
    await writeFile(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  const content = await readFile(STORE_PATH, "utf8");
  return JSON.parse(content) as QingzhiStore;
}

async function writeStore(store: QingzhiStore) {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getQingzhiCenterRecord(userId: string) {
  const store = await readStore();
  return store.users[userId] ?? null;
}

export async function saveQingzhiCenterProfile(input: {
  userId: string;
  displayName?: string;
  profile: QingzhiProfilePayload;
}) {
  const store = await readStore();
  const existing = store.users[input.userId];
  const now = new Date().toISOString();

  const nextRecord: QingzhiCenterRecord = {
    userId: input.userId,
    displayName: input.displayName ?? existing?.displayName,
    profile: input.profile,
    reminderSettings: existing?.reminderSettings ?? DEFAULT_REMINDER_SETTINGS,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastGeneratedAt: existing?.lastGeneratedAt,
    lastAdviceScope: existing?.lastAdviceScope,
    lastAdviceDate: existing?.lastAdviceDate
  };

  store.users[input.userId] = nextRecord;
  await writeStore(store);
  return nextRecord;
}

export async function saveQingzhiReminderSettings(input: {
  userId: string;
  reminderSettings: QingzhiReminderSettings;
}) {
  const store = await readStore();
  const existing = store.users[input.userId];

  if (!existing) {
    throw new Error("User archive not found");
  }

  const nextRecord: QingzhiCenterRecord = {
    ...existing,
    reminderSettings: input.reminderSettings,
    updatedAt: new Date().toISOString()
  };

  store.users[input.userId] = nextRecord;
  await writeStore(store);
  return nextRecord;
}

export async function markQingzhiAdviceGenerated(input: {
  userId: string;
  scope: QingzhiAdviceInput["scope"];
  date: string;
}) {
  const store = await readStore();
  const existing = store.users[input.userId];

  if (!existing) {
    return null;
  }

  const nextRecord: QingzhiCenterRecord = {
    ...existing,
    updatedAt: new Date().toISOString(),
    lastGeneratedAt: new Date().toISOString(),
    lastAdviceScope: input.scope,
    lastAdviceDate: input.date
  };

  store.users[input.userId] = nextRecord;
  await writeStore(store);
  return nextRecord;
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
