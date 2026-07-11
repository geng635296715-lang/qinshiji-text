import { authFetch, fetchCurrentUser } from "/session.js";

const summaryCards = document.querySelectorAll("#account-summary .display-value");
const profileForm = document.querySelector("#profile-bazi-form");
const reminderForm = document.querySelector("#reminder-form");
const profileMessage = document.querySelector("#profile-bazi-message");
const reminderMessage = document.querySelector("#reminder-message");
const latestQingzhiSummary = document.querySelector("#latest-qingzhi-summary");
const divinationHistory = document.querySelector("#divination-history");
const aiHistory = document.querySelector("#ai-history");
const divinationCountChip = document.querySelector("#divination-count-chip");
const aiCountChip = document.querySelector("#ai-count-chip");
const accountAvatar = document.querySelector("#account-avatar");
const accountDisplayName = document.querySelector("#account-display-name");
const accountUsername = document.querySelector("#account-username");
const accountEmail = document.querySelector("#account-email");

profileForm.addEventListener("submit", onSaveProfile);
reminderForm.addEventListener("submit", onSaveReminder);

bootstrap();

async function bootstrap() {
  const user = await fetchCurrentUser();
  if (!user) {
    window.location.href = "/auth.html";
    return;
  }

  await loadOverview();
}

async function loadOverview() {
  try {
    const response = await authFetch("/api/v1/user-center/overview");
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/auth.html";
        return;
      }
      throw new Error(data.message || "读取个人中心失败");
    }

    renderOverview(data.user, data.overview);
  } catch (error) {
    profileMessage.textContent = error instanceof Error ? error.message : "读取个人中心失败";
  }
}

async function onSaveProfile(event) {
  event.preventDefault();

  const payload = {
    calendarType: document.querySelector("#profile-calendar-type").value,
    birthDate: document.querySelector("#profile-birth-date").value,
    birthTime: document.querySelector("#profile-birth-time").value,
    gender: document.querySelector("#profile-gender").value,
    birthPlace: document.querySelector("#profile-birth-place").value.trim(),
    focusYear: toOptionalNumber(document.querySelector("#profile-focus-year").value),
    isVip: true
  };

  try {
    const response = await authFetch("/api/v1/user-center/bazi-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "保存八字档案失败");
    }

    profileMessage.textContent = "八字档案已保存，最新命盘快照已同步。";
    renderOverview(await fetchCurrentUser(), data.overview);
  } catch (error) {
    profileMessage.textContent = error instanceof Error ? error.message : "保存八字档案失败";
  }
}

async function onSaveReminder(event) {
  event.preventDefault();

  const payload = {
    dailyEnabled: document.querySelector("#profile-daily-enabled").checked,
    dailyTime: document.querySelector("#profile-daily-time").value || "08:30",
    monthlyEnabled: document.querySelector("#profile-monthly-enabled").checked,
    monthlyDay: Number(document.querySelector("#profile-monthly-day").value || 1),
    channel: document.querySelector("#profile-reminder-channel").value
  };

  try {
    const response = await authFetch("/api/v1/user-center/reminder-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "保存提醒设置失败");
    }

    reminderMessage.textContent = "提醒设置已保存。";
    renderReminderSettings(data.overview.reminderSettings);
  } catch (error) {
    reminderMessage.textContent = error instanceof Error ? error.message : "保存提醒设置失败";
  }
}

function renderOverview(user, overview) {
  summaryCards[0].textContent = user.displayName || user.username;
  summaryCards[1].textContent = overview.latestBaziProfile ? "已保存" : "未保存";
  summaryCards[2].textContent = `${overview.divinationHistory.length + overview.aiConsultationHistory.length} 条`;
  summaryCards[3].textContent = overview.latestQingzhiAdvice?.score ? `${overview.latestQingzhiAdvice.score} 分` : "未生成";

  renderAccountProfile(user);
  fillProfileForm(overview.latestBaziProfile);
  renderReminderSettings(overview.reminderSettings);
  renderLatestQingzhiAdvice(overview.latestQingzhiAdvice);
  renderDivinationHistory(overview.divinationHistory);
  renderAiHistory(overview.aiConsultationHistory);
}

function renderAccountProfile(user) {
  if (!user || !accountAvatar || !accountDisplayName || !accountUsername || !accountEmail) {
    return;
  }

  const displayName = user.displayName || user.username || "\u9752\u7b6e\u7528\u6237";
  accountAvatar.textContent = displayName.slice(0, 2).toUpperCase();
  accountDisplayName.textContent = displayName;
  accountUsername.textContent = `@${user.username || "unknown"}`;
  accountEmail.textContent = user.email || "--";
}

function fillProfileForm(profile) {
  if (!profile) {
    return;
  }

  document.querySelector("#profile-calendar-type").value = profile.calendarType || "solar";
  document.querySelector("#profile-birth-date").value = profile.birthDate || "";
  document.querySelector("#profile-birth-time").value = profile.birthTime || "";
  document.querySelector("#profile-gender").value = profile.gender || "female";
  document.querySelector("#profile-birth-place").value = profile.birthPlace || "";
  document.querySelector("#profile-focus-year").value = profile.focusYear || new Date().getFullYear();
}

function renderReminderSettings(settings) {
  document.querySelector("#profile-daily-enabled").checked = Boolean(settings?.dailyEnabled);
  document.querySelector("#profile-daily-time").value = settings?.dailyTime || "08:30";
  document.querySelector("#profile-monthly-enabled").checked = Boolean(settings?.monthlyEnabled);
  document.querySelector("#profile-monthly-day").value = String(settings?.monthlyDay || 1);
  document.querySelector("#profile-reminder-channel").value = settings?.channel || "site";
}

function renderLatestQingzhiAdvice(advice) {
  if (!advice) {
    latestQingzhiSummary.innerHTML = `
      <div class="empty-state">
        当前还没有生成过青筮建议。进入青筮建议页面并生成一次后，这里会展示最近一次建议分、范围、日期和摘要。
      </div>
    `;
    return;
  }

  const scopeLabel = advice.lastAdviceScope === "monthly" ? "本月建议" : "今日建议";
  const keywords = Array.isArray(advice.keywords) ? advice.keywords : [];

  latestQingzhiSummary.innerHTML = `
    <div class="chart-grid">
      <article class="result-card">
        <p class="card-label">建议分</p>
        <div class="display-value">${escapeHtml(advice.score ?? "--")}${advice.score ? " 分" : ""}</div>
      </article>
      <article class="result-card">
        <p class="card-label">建议范围</p>
        <div class="display-value">${scopeLabel}</div>
      </article>
      <article class="result-card">
        <p class="card-label">建议日期</p>
        <div class="display-value">${escapeHtml(advice.lastAdviceDate || "--")}</div>
      </article>
      <article class="result-card">
        <p class="card-label">生成时间</p>
        <div class="display-value">${escapeHtml(formatDateTime(advice.lastGeneratedAt))}</div>
      </article>
    </div>
    <div class="chart-card" style="margin-top: 16px;">
      <h3>摘要</h3>
      <div class="info-note" style="margin-top: 12px;">${escapeHtml(advice.summary || "暂无摘要。")}</div>
      ${
        keywords.length
          ? `<div class="tag-list" style="margin-top: 12px;">${keywords.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>`
          : ""
      }
      <div class="button-row">
        <a class="primary-btn" href="/qingzhi.html">继续查看完整建议</a>
      </div>
    </div>
  `;
}

function renderDivinationHistory(records) {
  divinationCountChip.textContent = `${records.length} 条`;

  if (!records.length) {
    divinationHistory.innerHTML = '<div class="empty-state">当前还没有起卦记录。后续在六爻或梅花页面起卦后，这里会自动沉淀。</div>';
    return;
  }

  divinationHistory.innerHTML = records
    .map(
      (record) => `
        <article class="history-card">
          <div class="history-card-head">
            <div>
              <p class="card-label">${escapeHtml(methodLabel(record.method))} · ${escapeHtml(record.topic || "未分类")}</p>
              <h3>${escapeHtml(record.title || "未命名记录")}</h3>
            </div>
            <span class="chip">${escapeHtml(formatDateTime(record.createdAt))}</span>
          </div>
          <p class="muted">${escapeHtml(record.description || buildDivinationSummary(record.requestPayload))}</p>
        </article>
      `
    )
    .join("");
}

function renderAiHistory(records) {
  aiCountChip.textContent = `${records.length} 条`;

  if (!records.length) {
    aiHistory.innerHTML = '<div class="empty-state">当前还没有 AI 咨询记录。后续在八字、合盘、六爻、梅花或青筮建议页面提问后，这里会自动保存。</div>';
    return;
  }

  aiHistory.innerHTML = records
    .map(
      (record) => `
        <article class="history-card">
          <div class="history-card-head">
            <div>
              <p class="card-label">${escapeHtml(moduleLabel(record.module))}${record.model ? ` · ${escapeHtml(record.model)}` : ""}</p>
              <h3>${escapeHtml(record.question)}</h3>
            </div>
            <span class="chip">${escapeHtml(formatDateTime(record.createdAt))}</span>
          </div>
          <p class="muted">${escapeHtml(truncate(record.answer, 180))}</p>
        </article>
      `
    )
    .join("");
}

function buildDivinationSummary(payload) {
  if (!payload || typeof payload !== "object") {
    return "已保存本次起卦输入与结果。";
  }

  const entries = [];
  if (payload.intent) entries.push(`所问事项：${payload.intent}`);
  if (payload.mode) entries.push(`起卦方式：${payload.mode}`);
  if (payload.inputMode) entries.push(`取数方式：${payload.inputMode}`);
  return entries.join("，") || "已保存本次起卦输入与结果。";
}

function moduleLabel(module) {
  const mapping = {
    bazi: "八字咨询",
    compatibility: "合盘咨询",
    liuyao: "六爻咨询",
    meihua: "梅花咨询",
    "qingzhi-advice": "青筮建议",
    qingzhi: "青筮建议"
  };
  return mapping[module] || module || "AI 咨询";
}

function methodLabel(method) {
  return method === "liuyao" ? "六爻金钱课" : method === "meihua" ? "梅花易数" : method;
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "--";
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function truncate(text, maxLength) {
  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function toOptionalNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
