import { authFetch, fetchCurrentUser, getSessionToken } from "/session.js";

const resultContainer = document.querySelector("#qingzhi-result");
const activeUserChip = document.querySelector("#active-user-chip");
const currentUserName = document.querySelector("#current-user-name");
const archiveStatusNote = document.querySelector("#archive-status-note");
const reminderPreviewNote = document.querySelector("#reminder-preview-note");
const reloadCenterButton = document.querySelector("#reload-center");

const generateFromArchiveButton = document.querySelector("#generate-from-archive");
const adviceScopeInput = document.querySelector("#advice-scope");
const adviceDateInput = document.querySelector("#advice-date");

const profileForm = document.querySelector("#qingzhi-profile-form");
const calendarTypeInput = document.querySelector("#qingzhi-calendar-type");
const solarFields = document.querySelector("#qingzhi-solar-fields");
const lunarFields = document.querySelector("#qingzhi-lunar-fields");
const birthDateInput = document.querySelector("#qingzhi-birth-date");
const birthTimeInput = document.querySelector("#qingzhi-birth-time");
const genderInput = document.querySelector("#qingzhi-gender");
const birthPlaceInput = document.querySelector("#qingzhi-birth-place");
const lunarYearInput = document.querySelector("#qingzhi-lunar-year");
const lunarMonthInput = document.querySelector("#qingzhi-lunar-month");
const lunarDayInput = document.querySelector("#qingzhi-lunar-day");
const lunarHourInput = document.querySelector("#qingzhi-lunar-hour");
const refreshLunarButton = document.querySelector("#qingzhi-refresh-lunar");

const reminderForm = document.querySelector("#qingzhi-reminder-form");
const dailyEnabledInput = document.querySelector("#daily-enabled");
const dailyTimeInput = document.querySelector("#daily-time");
const monthlyEnabledInput = document.querySelector("#monthly-enabled");
const monthlyDayInput = document.querySelector("#monthly-day");
const reminderChannelInput = document.querySelector("#reminder-channel");

const aiChat = document.querySelector("#qingzhi-ai-chat");
const aiQuestion = document.querySelector("#qingzhi-ai-question");
const aiSend = document.querySelector("#qingzhi-ai-send");
const aiSuggestions = document.querySelector("#qingzhi-ai-suggestions");

let currentUser = null;
let currentArchive = null;
let latestAiContext = null;
let chatHistory = [];

adviceDateInput.value = new Date().toISOString().slice(0, 10);

calendarTypeInput.addEventListener("change", handleCalendarToggle);
lunarYearInput.addEventListener("change", () => loadLunarPicker());
lunarMonthInput.addEventListener("change", () => loadLunarPicker());
refreshLunarButton.addEventListener("click", () => loadLunarPicker());
reloadCenterButton.addEventListener("click", () => hydrateCenter(true));
profileForm.addEventListener("submit", onSaveProfile);
generateFromArchiveButton.addEventListener("click", () => generateAdviceFromArchive());
reminderForm.addEventListener("submit", onSaveReminder);
aiSend.addEventListener("click", onAiAsk);

handleCalendarToggle();
loadLunarPicker();
renderSuggestionChips([
  "未来 7 天哪一天最适合见人？",
  "本月哪个阶段最适合推进事业？",
  "我的穿戴颜色应该怎么选？",
  "哪一天更适合做重要决断？"
]);

bootstrap();

async function bootstrap() {
  if (!getSessionToken()) {
    syncLoggedOutState();
    return;
  }

  await hydrateCenter(true);
}

async function hydrateCenter(autoGenerate = false) {
  currentUser = await fetchCurrentUser();

  if (!currentUser) {
    syncLoggedOutState();
    return;
  }

  currentUserName.textContent = currentUser.displayName || currentUser.username;
  activeUserChip.textContent = `当前用户：${currentUser.displayName || currentUser.username}`;

  try {
    const response = await authFetch("/api/v1/qingzhi-advice/center");
    const data = await response.json();

    if (!response.ok) {
      archiveStatusNote.textContent = data.message || "读取青筮中心失败。";
      return;
    }

    currentArchive = data.archive;

    if (currentArchive) {
      fillArchive(currentArchive);
      applyReminder(currentArchive.reminderSettings);
      reminderPreviewNote.textContent = data.reminderPreview.summary;
      archiveStatusNote.textContent = "已读取当前登录用户档案。";

      if (autoGenerate) {
        await generateAdviceFromArchive();
      }
    } else {
      archiveStatusNote.textContent = "当前账号还没有八字档案，请先保存档案。";
      reminderPreviewNote.textContent = "尚未建立提醒配置。";
    }
  } catch (error) {
    archiveStatusNote.textContent = error instanceof Error ? error.message : "读取青筮中心失败。";
  }
}

async function onSaveProfile(event) {
  event.preventDefault();

  if (!currentUser) {
    archiveStatusNote.textContent = "请先登录用户，再保存八字档案。";
    return;
  }

  const payload = {
    displayName: currentUser.displayName || currentUser.username,
    profile: await buildProfilePayload()
  };

  try {
    const response = await authFetch("/api/v1/qingzhi-advice/center/save-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      archiveStatusNote.textContent = data.message || "保存档案失败。";
      return;
    }

    currentArchive = data.archive;
    reminderPreviewNote.textContent = data.reminderPreview.summary;
    archiveStatusNote.textContent = "八字档案已保存，正在自动生成青筮建议。";
    await generateAdviceFromArchive();
  } catch (error) {
    archiveStatusNote.textContent = error instanceof Error ? error.message : "保存档案失败。";
  }
}

async function onSaveReminder(event) {
  event.preventDefault();

  if (!currentUser) {
    reminderPreviewNote.textContent = "请先登录并保存用户档案。";
    return;
  }

  const payload = {
    reminderSettings: {
      dailyEnabled: dailyEnabledInput.checked,
      dailyTime: dailyTimeInput.value,
      monthlyEnabled: monthlyEnabledInput.checked,
      monthlyDay: Number(monthlyDayInput.value),
      channel: reminderChannelInput.value
    }
  };

  try {
    const response = await authFetch("/api/v1/qingzhi-advice/center/save-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      reminderPreviewNote.textContent = data.message || "保存提醒配置失败。";
      return;
    }

    currentArchive = data.archive;
    reminderPreviewNote.textContent = data.reminderPreview.summary;
  } catch (error) {
    reminderPreviewNote.textContent = error instanceof Error ? error.message : "保存提醒配置失败。";
  }
}

async function generateAdviceFromArchive() {
  if (!currentUser) {
    archiveStatusNote.textContent = "请先登录用户。";
    return;
  }

  resultContainer.innerHTML = '<div class="empty-state">正在生成青筮建议，请稍候...</div>';

  try {
    const response = await authFetch("/api/v1/qingzhi-advice/generate-from-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: adviceScopeInput.value,
        date: adviceDateInput.value
      })
    });
    const data = await response.json();

    if (!response.ok) {
      resultContainer.innerHTML = `<div class="empty-state">${data.message || "生成建议失败。"}</div>`;
      return;
    }

    currentArchive = data.archive;
    latestAiContext = data.aiContext;
    chatHistory = [];
    reminderPreviewNote.textContent = data.reminderPreview.summary;
    archiveStatusNote.textContent = "已按当前登录用户档案自动生成建议。";
    renderAdviceResult(data.result);
    aiChat.innerHTML =
      '<div class="chat-bubble assistant">青筮建议已更新。你现在可以继续追问哪天适合签约、见人、决策，或者如何运用穿戴与方向建议。</div>';
    renderSuggestionChips(
      latestAiContext?.suggestedQuestions || [
        "未来 7 天哪天最适合推进事业？",
        "我该优先见人还是先整理自己？",
        "本月更适合主动还是保守？"
      ]
    );
  } catch (error) {
    resultContainer.innerHTML = `<div class="empty-state">${error instanceof Error ? error.message : "生成建议失败。"}</div>`;
  }
}

async function onAiAsk() {
  if (!latestAiContext) {
    appendChat("assistant", "请先生成青筮建议，再开始咨询。");
    return;
  }

  const question = aiQuestion.value.trim();
  if (!question) {
    return;
  }

  appendChat("user", question);
  aiQuestion.value = "";

  try {
    const response = await authFetch("/api/v1/ai/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "qingzhi-advice",
        sessionId: "qingzhi-advice-web-session",
        question,
        history: chatHistory,
        context: {
          module: "qingzhi-advice",
          aiContext: latestAiContext
        }
      })
    });
    const data = await response.json();

    if (!response.ok) {
      appendChat("assistant", data.message || "AI 咨询失败。");
      return;
    }

    appendChat("assistant", data.result.answer);
  } catch (error) {
    appendChat("assistant", error instanceof Error ? error.message : "AI 咨询失败。");
  }
}

function syncLoggedOutState() {
  currentUser = null;
  currentArchive = null;
  latestAiContext = null;
  chatHistory = [];
  currentUserName.textContent = "请先登录";
  activeUserChip.textContent = "未登录";
  archiveStatusNote.textContent = "请先登录后读取八字档案。";
  reminderPreviewNote.textContent = "登录后可同步读取个人中心的提醒配置。";
}

function handleCalendarToggle() {
  const isLunar = calendarTypeInput.value === "lunar";
  solarFields.hidden = isLunar;
  lunarFields.hidden = !isLunar;
}

async function loadLunarPicker() {
  try {
    const year = Number(lunarYearInput.value || 1994);
    const month = Number(lunarMonthInput.value || 1);
    const day = Number(lunarDayInput.value || 1);
    const response = await fetch(`/api/v1/bazi/lunar-picker?year=${year}&month=${month}&day=${day}`);
    const data = await response.json();

    if (!response.ok) {
      return;
    }

    lunarMonthInput.innerHTML = data.result.months
      .map(
        (item) =>
          `<option value="${item.value}" ${item.value === data.result.selected.month ? "selected" : ""}>${item.label}${item.isLeap ? "（闰）" : ""}${item.ganzhi ? ` · ${item.ganzhi}` : ""}</option>`
      )
      .join("");

    lunarDayInput.innerHTML = data.result.days
      .map(
        (item) =>
          `<option value="${item.value}" ${item.value === data.result.selected.day ? "selected" : ""}>${item.label}</option>`
      )
      .join("");

    lunarHourInput.innerHTML = data.result.hourOptions
      .map((item) => `<option value="${item.value}">${item.label} · ${item.range}</option>`)
      .join("");
  } catch (error) {
    console.error(error);
  }
}

async function buildProfilePayload() {
  if (calendarTypeInput.value === "solar") {
    return {
      calendarType: "solar",
      birthDate: birthDateInput.value,
      birthTime: birthTimeInput.value,
      gender: genderInput.value,
      birthPlace: birthPlaceInput.value
    };
  }

  return {
    calendarType: "lunar",
    birthDate: `${Number(lunarYearInput.value)}-${Number(lunarMonthInput.value)}-${String(Number(lunarDayInput.value)).padStart(2, "0")}`,
    birthTime: lunarHourInput.value || "09:00",
    gender: genderInput.value,
    birthPlace: birthPlaceInput.value
  };
}

function fillArchive(archive) {
  calendarTypeInput.value = archive.profile.calendarType;
  genderInput.value = archive.profile.gender;
  birthPlaceInput.value = archive.profile.birthPlace;
  handleCalendarToggle();

  if (archive.profile.calendarType === "solar") {
    birthDateInput.value = archive.profile.birthDate;
    birthTimeInput.value = archive.profile.birthTime;
    return;
  }

  const match = archive.profile.birthDate.match(/^(\d{4})-(-?\d{1,2})-(\d{1,2})$/);
  if (match) {
    lunarYearInput.value = match[1];
    loadLunarPicker().then(() => {
      lunarMonthInput.value = match[2];
      lunarDayInput.value = String(Number(match[3]));
    });
  }
  lunarHourInput.value = archive.profile.birthTime;
}

function applyReminder(reminderSettings) {
  dailyEnabledInput.checked = reminderSettings.dailyEnabled;
  dailyTimeInput.value = reminderSettings.dailyTime;
  monthlyEnabledInput.checked = reminderSettings.monthlyEnabled;
  monthlyDayInput.value = String(reminderSettings.monthlyDay);
  reminderChannelInput.value = reminderSettings.channel;
}

function renderAdviceResult(result) {
  const score = result.advice.score;
  const bestDays = result.auspiciousAdvice.bestDays || [];
  const cautionDays = result.auspiciousAdvice.cautionDays || [];
  const categories = result.auspiciousAdvice.categoryBreakdown || [];
  const monthlyHighlights = result.monthlyPanel?.highlights || [];

  const sevenDayCards = result.sevenDayCalendar
    .map(
      (item) => `
      <article class="day-card ${item.isToday ? "is-today" : ""}">
        <div class="section-title">
          <div>
            <p class="card-label">${item.solar} · 周${item.week}</p>
            <h4>${item.ganzhiDay}</h4>
          </div>
          <span class="chip">${item.score} 分</span>
        </div>
        <p class="${toneClass(item.tone)}">${item.summary}</p>
        <div class="meter"><span style="width:${item.score}%"></span></div>
        <div class="mini-list" style="margin-top:12px;">
          <span class="chip">${item.lunar}</span>
          <span class="chip">${item.recommendedTag}</span>
          ${item.jieQi ? `<span class="chip">${item.jieQi}</span>` : ""}
        </div>
        <div class="tag-list" style="margin-top:12px;">
          ${item.recommendedCategories.map((entry) => `<span class="chip">${entry.label} ${entry.score}</span>`).join("")}
        </div>
      </article>
    `
    )
    .join("");

  const categoryCards = categories
    .map(
      (item) => `
      <article class="chart-card">
        <div class="section-title">
          <h4>${item.label}</h4>
          <span class="chip">${item.summary}</span>
        </div>
        <div class="two-column-text">
          <div class="info-note">
            最佳：${item.bestDay.solar} · 周${item.bestDay.week} · ${item.bestDay.ganzhiDay} · ${item.bestDay.score} 分
          </div>
          <div class="info-note">
            注意：${item.cautionDay.solar} · 周${item.cautionDay.week} · ${item.cautionDay.ganzhiDay} · ${item.cautionDay.score} 分
          </div>
        </div>
      </article>
    `
    )
    .join("");

  const colorCards = result.advice.recommendedColors
    .map(
      (item) => `
      <article class="result-card">
        <p class="card-label">${item.element}</p>
        <div class="mini-list">
          <span class="element-swatch" style="background:${item.hex}; width:22px; height:22px;"></span>
          <strong>${item.name}</strong>
        </div>
        <div class="muted" style="margin-top:8px;">建议作为今日主色、内搭色或配饰点缀色使用。</div>
      </article>
    `
    )
    .join("");

  const directionCards = result.directionSceneAdvice.recommendedDirections
    .map(
      (item) => `
      <article class="result-card">
        <p class="card-label">优先级 ${item.priority}</p>
        <div class="display-value">${item.direction}</div>
        <div class="muted">${item.explanation}</div>
      </article>
    `
    )
    .join("");

  const sceneCards = result.directionSceneAdvice.sceneSuggestions
    .map(
      (item) => `
      <article class="chart-card">
        <h4>${item.type}</h4>
        <div class="tag-list" style="margin-top:12px;">${item.scenes.map((scene) => `<span class="chip">${scene}</span>`).join("")}</div>
        <div class="info-note" style="margin-top:12px;">${item.suggestion}</div>
      </article>
    `
    )
    .join("");

  const yiJiCards = `
    <article class="chart-card">
      <h4>宜做事项</h4>
      <div class="tag-list" style="margin-top:12px;">${result.timing.yi.map((item) => `<span class="chip">${item}</span>`).join("")}</div>
      <ul class="vip-list" style="margin-top:12px;">${result.advice.dos.map((item) => `<li>${item}</li>`).join("")}</ul>
    </article>
    <article class="chart-card">
      <h4>忌做事项</h4>
      <div class="tag-list" style="margin-top:12px;">${result.timing.ji.map((item) => `<span class="chip">${item}</span>`).join("")}</div>
      <ul class="vip-list" style="margin-top:12px;">${result.advice.donts.map((item) => `<li>${item}</li>`).join("")}</ul>
    </article>
  `;

  const monthlyCards = monthlyHighlights
    .map(
      (item) => `
      <article class="flow-card">
        <p class="card-label">${item.month}月 · ${item.ganzhi}</p>
        <p class="${toneClass(item.tone)}">${item.note}</p>
      </article>
    `
    )
    .join("");

  resultContainer.innerHTML = `
    <section class="section-block score-hero">
      <div class="hero-grid">
        <article>
          <p class="card-label">${result.advice.scope === "daily" ? "今日建议分" : "本月建议分"}</p>
          <div class="hero-score">${score} <small>分</small></div>
          <p class="hero-quote">${result.advice.summary}</p>
        </article>
        <article>
          <p class="card-label">月令与节气</p>
          <div class="display-value">${result.timing.jieQi}</div>
          <div class="info-note" style="margin-top:12px;">
            流年：${result.timing.currentLiuNian?.ganzhi || "暂缺"} · 月令：${result.timing.currentMonth?.ganzhi || "暂缺"}
          </div>
        </article>
        <article>
          <p class="card-label">穿戴主线</p>
          <div class="tag-list">
            ${result.advice.recommendedStyleKeywords.map((item) => `<span class="chip">${item}</span>`).join("")}
          </div>
          <div class="tag-list" style="margin-top:12px;">
            ${result.advice.accessorySuggestions.map((item) => `<span class="chip">${item}</span>`).join("")}
          </div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>7 天节奏日历</h3>
        <div class="mini-list">
          ${result.advice.badges.map((item) => `<span class="chip">${item.label}：${item.value}</span>`).join("")}
        </div>
      </div>
      <div class="seven-day-grid">${sevenDayCards}</div>
    </section>

    <section class="section-block chart-grid">
      <article class="chart-card">
        <div class="section-title">
          <h3>吉日建议</h3>
          <span class="chip">本轮最顺的日子</span>
        </div>
        <div class="list-stack">
          ${bestDays.map((item) => `<div class="info-note">${item.solar} · 周${item.week} · ${item.score} 分 · ${item.reason}</div>`).join("")}
        </div>
      </article>
      <article class="chart-card">
        <div class="section-title">
          <h3>注意日期</h3>
          <span class="chip">不宜强推</span>
        </div>
        <div class="list-stack">
          ${cautionDays.map((item) => `<div class="info-note">${item.solar} · 周${item.week} · ${item.score} 分 · ${item.reason}</div>`).join("")}
        </div>
      </article>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>吉日分类细化</h3>
        <span class="chip">签约 / 见人 / 感情 / 决断等</span>
      </div>
      <div class="chart-grid">${categoryCards}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>月令 + 黄道吉日 + 个性穿戴建议</h3>
        <span class="chip">设计落地版</span>
      </div>
      <div class="chart-grid">
        <article class="chart-card">
          <h4>主色建议</h4>
          <div class="chart-grid" style="margin-top:12px;">${colorCards}</div>
        </article>
        <article class="chart-card">
          <h4>风格与配饰</h4>
          <div class="tag-list" style="margin-top:12px;">
            ${result.advice.recommendedStyleKeywords.map((item) => `<span class="chip">${item}</span>`).join("")}
          </div>
          <div class="tag-list" style="margin-top:12px;">
            ${result.advice.accessorySuggestions.map((item) => `<span class="chip">${item}</span>`).join("")}
          </div>
          <div class="info-note" style="margin-top:12px;">优先把建议颜色落到上衣、内搭、手机壳、包饰、首饰等高频可见位置，形成稳定的日常提示感。</div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>方向 / 场景建议</h3>
        <span class="chip">出行与决策辅助</span>
      </div>
      <div class="chart-grid">${directionCards}</div>
      <div class="chart-grid" style="margin-top:16px;">${sceneCards}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>宜忌事项</h3>
        <span class="chip">当天可执行</span>
      </div>
      <div class="chart-grid">${yiJiCards}</div>
    </section>

    <section class="section-block chart-grid">
      <article class="chart-card">
        <h3>事业提醒</h3>
        <div class="info-note" style="margin-top:12px;">${result.advice.careerHint}</div>
      </article>
      <article class="chart-card">
        <h3>关系提醒</h3>
        <div class="info-note" style="margin-top:12px;">${result.advice.relationshipHint}</div>
      </article>
    </section>

    ${
      monthlyCards
        ? `
    <section class="section-block">
      <div class="section-title">
        <h3>月度走势</h3>
        <span class="chip">按月令展开</span>
      </div>
      <div class="chart-grid">${monthlyCards}</div>
    </section>
    `
        : ""
    }
  `;
}

function renderSuggestionChips(items) {
  aiSuggestions.innerHTML = items
    .slice(0, 4)
    .map((item) => `<button class="suggestion-chip" type="button">${item}</button>`)
    .join("");

  aiSuggestions.querySelectorAll(".suggestion-chip").forEach((button) => {
    button.addEventListener("click", () => {
      aiQuestion.value = button.textContent;
      aiQuestion.focus();
    });
  });
}

function appendChat(role, content) {
  if (role === "user" || role === "assistant") {
    chatHistory.push({ role, content });
  }

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = content;
  aiChat.appendChild(bubble);
  aiChat.scrollTop = aiChat.scrollHeight;
}

function toneClass(tone) {
  if (tone === "good") return "tone-good";
  if (tone === "care") return "tone-care";
  return "tone-neutral";
}
