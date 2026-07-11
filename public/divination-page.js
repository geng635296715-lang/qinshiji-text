import { authFetch, fetchCurrentUser } from "/session.js";

const page = document.body.dataset.divinationPage;
const config = {
  liuyao: {
    title: "六爻金钱课",
    subtitle: "自动起卦、手动录爻、AI 追问",
    castEndpoint: "/api/v1/liuyao/cast-view",
    aiEndpoint: "/api/v1/liuyao/ai-context",
    aiModule: "liuyao",
    sessionId: "liuyao-web-session",
    suggestions: [
      "这件事现在更适合推进还是等一等？",
      "这卦的核心矛盾在哪一爻？",
      "如果只看近期，最该注意什么？",
      "结果里哪个变化最值得重视？"
    ]
  },
  meihua: {
    title: "梅花易数",
    subtitle: "时间起卦、数字起卦、外应扩展",
    castEndpoint: "/api/v1/meihua/cast-view",
    aiEndpoint: "/api/v1/meihua/ai-context",
    aiModule: "meihua",
    sessionId: "meihua-web-session",
    suggestions: [
      "这卦更像是内因还是外部环境在推？",
      "我现在更适合推进还是调整方向？",
      "请把体用和变卦关系讲明白一些。",
      "如果按时间线看，转机大概落在哪里？"
    ]
  }
};

const current = config[page];
if (!current) {
  throw new Error(`Unknown divination page: ${page}`);
}

const form = document.querySelector(`[data-form="${page}"]`);
const resultContainer = document.querySelector(`[data-result="${page}"]`);
const aiChat = document.querySelector(`[data-ai-chat="${page}"]`);
const aiQuestion = document.querySelector(`[data-ai-question="${page}"]`);
const aiSend = document.querySelector(`[data-ai-send="${page}"]`);
const aiSuggestions = document.querySelector(`[data-ai-suggestions="${page}"]`);
const refreshButton = document.querySelector(`[data-refresh="${page}"]`);

let latestAiContext = null;
let chatHistory = [];

renderSuggestions(current.suggestions);
bindEvents();
bootstrap();

function bindEvents() {
  form?.addEventListener("submit", onSubmit);
  aiSend?.addEventListener("click", onAiAsk);
  refreshButton?.addEventListener("click", refreshForm);
  aiSuggestions?.addEventListener("click", onSuggestionClick);
  if (page === "liuyao") {
    const mode = document.querySelector("#liuyao-casting-mode");
    mode?.addEventListener("change", toggleLiuyaoMode);
    document.querySelector("[data-randomize-lines]")?.addEventListener("click", randomizeLiuyaoLines);
    toggleLiuyaoMode();
  }
  if (page === "meihua") {
    const mode = document.querySelector("#meihua-casting-mode");
    mode?.addEventListener("change", toggleMeihuaMode);
    toggleMeihuaMode();
  }
}

async function bootstrap() {
  const user = await safeFetchCurrentUser();
  if (user) {
    const chip = document.querySelector(`[data-user-chip="${page}"]`);
    if (chip) {
      chip.textContent = user.displayName || user.username || "已登录";
    }
  }
}

async function onSubmit(event) {
  event.preventDefault();
  resultContainer.innerHTML = `<div class="empty-state">正在起卦，请稍候...</div>`;

  try {
    const payload = buildPayload();
    const response = await authFetch(current.castEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      resultContainer.innerHTML = `<div class="empty-state">${escapeHtml(data.message || "起卦失败")}</div>`;
      return;
    }

    const aiRes = await authFetch(current.aiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const aiData = await aiRes.json();

    latestAiContext = aiData.aiContext;
    chatHistory = [];
    renderPageView(data.view, data.result);
    aiChat.innerHTML = `<div class="chat-bubble assistant">结果已生成，你可以继续追问这卦的核心转折、时间线或行动建议。</div>`;
  } catch (error) {
    resultContainer.innerHTML = `<div class="empty-state">${escapeHtml(error instanceof Error ? error.message : "起卦失败")}</div>`;
  }
}

async function onAiAsk() {
  if (!latestAiContext) {
    appendChat("assistant", "请先起卦，再开始追问。");
    return;
  }

  const question = aiQuestion?.value.trim();
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
        module: current.aiModule,
        sessionId: current.sessionId,
        question,
        history: chatHistory,
        context: {
          module: current.aiModule,
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

function buildPayload() {
  if (page === "liuyao") {
    const castingMode = document.querySelector("#liuyao-casting-mode").value;
    const payload = {
      topic: document.querySelector("#liuyao-topic").value,
      title: document.querySelector("#liuyao-title").value.trim(),
      description: document.querySelector("#liuyao-description").value.trim() || undefined,
      castingMode,
      occurredAt: document.querySelector("#liuyao-occurred-at").value || undefined
    };

    if (castingMode === "manual") {
      payload.lines = Array.from({ length: 6 }, (_, index) => document.querySelector(`#liuyao-line-${index + 1}`).value);
    }

    return payload;
  }

  const castingMode = document.querySelector("#meihua-casting-mode").value;
  const payload = {
    topic: document.querySelector("#meihua-topic").value,
    title: document.querySelector("#meihua-title").value.trim(),
    description: document.querySelector("#meihua-description").value.trim() || undefined,
    castingMode,
    occurredAt: document.querySelector("#meihua-occurred-at").value || undefined,
    timeMethod: document.querySelector("#meihua-time-method").value,
    externalOmen: buildExternalOmenPayload()
  };

  if (castingMode === "numbers") {
    const numbers = [
      readNumber("#meihua-number-1"),
      readNumber("#meihua-number-2"),
      readNumber("#meihua-number-3")
    ].filter((value) => Number.isFinite(value));

    payload.numbers = numbers;
    delete payload.timeMethod;
  } else {
    delete payload.numbers;
  }

  if (!hasExternalOmen(payload.externalOmen)) {
    delete payload.externalOmen;
  }

  return payload;
}

function buildExternalOmenPayload() {
  return {
    direction: document.querySelector("#meihua-omen-direction").value.trim() || undefined,
    sound: document.querySelector("#meihua-omen-sound").value.trim() || undefined,
    color: document.querySelector("#meihua-omen-color").value.trim() || undefined,
    motion: document.querySelector("#meihua-omen-motion").value.trim() || undefined,
    countNumber: readNumber("#meihua-omen-count"),
    touchedObject: document.querySelector("#meihua-omen-object").value.trim() || undefined,
    scene: document.querySelector("#meihua-omen-scene").value.trim() || undefined
  };
}

function hasExternalOmen(omen) {
  if (!omen) return false;
  return Object.values(omen).some((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function renderPageView(view, result) {
  const summaryCards = (view?.header?.summaryCards || [])
    .map(
      (card) => `
        <article class="result-mini-card">
          <p class="card-label">${escapeHtml(card.label || "")}</p>
          <strong>${escapeHtml(String(card.value ?? ""))}</strong>
          <p class="muted">${escapeHtml(card.note || "")}</p>
        </article>
      `
    )
    .join("");

  const sections = (view?.sections || [])
    .map((section) => renderSection(section))
    .join("");

  resultContainer.innerHTML = `
    <section class="section-block">
      <div class="section-title">
        <div>
          <p class="section-kicker">${escapeHtml(view?.page?.module || current.title)}</p>
          <h2>${escapeHtml(view?.page?.title || current.title)}</h2>
          <p class="muted">${escapeHtml(view?.page?.subtitle || "")}</p>
        </div>
      </div>
      <div class="summary-grid">${summaryCards}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>${escapeHtml(view?.header?.title || "起卦结果")}</h3>
      </div>
      <div class="info-note">${escapeHtml(view?.header?.summary || result?.interpretation?.overall || "")}</div>
      ${view?.header?.description ? `<div class="info-note" style="margin-top:12px;">${escapeHtml(view.header.description)}</div>` : ""}
    </section>

    <section class="list-stack">
      ${sections}
    </section>
  `;
}

function renderSection(section) {
  return `
    <article class="panel-card result-section">
      <div class="section-title">
        <div>
          <p class="section-kicker">${escapeHtml(section.type || "")}</p>
          <h3>${escapeHtml(section.title || "")}</h3>
        </div>
      </div>
      <div class="result-section-body">${renderSectionData(section.type, section.data)}</div>
    </article>
  `;
}

function renderSectionData(type, data) {
  if (type === "casting-summary") {
    return renderKeyCards(data);
  }
  if (type === "hexagram-overview") {
    return renderHexagramOverview(data);
  }
  if (type === "line-board") {
    return renderTable(data, ["row", "positionLabel", "lineLabel", "symbol", "changing", "marker"]);
  }
  if (type === "topic-panels") {
    return renderPairList(data, "title", "body");
  }
  if (type === "topic-interpretation") {
    return renderInterpretation(data);
  }
  if (type === "body-use") {
    return renderBodyUse(data);
  }
  if (type === "external-omen") {
    return renderKeyCards(data);
  }
  if (type === "topic-templates") {
    return renderTemplateCards(data);
  }
  if (type === "suggested-questions") {
    return renderChipGrid(data);
  }
  if (type === "search-panel") {
    if (!data) {
      return `<div class="empty-state">暂无搜索提示。</div>`;
    }
    return renderKeyCards(data);
  }
  if (type === "casting-animation") {
    return renderKeyCards(data);
  }
  if (type === "advanced-pattern") {
    return renderKeyCards(data);
  }
  return renderUnknownData(data);
}

function renderKeyCards(data) {
  const entries = normalizeEntries(data);
  if (!entries.length) {
    return `<div class="empty-state">暂无数据。</div>`;
  }

  return `<div class="result-card-grid">${entries
    .map(
      ([key, value]) => `
        <article class="result-mini-card">
          <p class="card-label">${escapeHtml(prettyKey(key))}</p>
          <div class="result-raw">${renderInlineValue(value)}</div>
        </article>
      `
    )
    .join("")}</div>`;
}

function renderHexagramOverview(data) {
  if (!data) return `<div class="empty-state">暂无卦象概览。</div>`;
  const cards = normalizeEntries(data)
    .map(
      ([key, value]) => `
        <article class="result-mini-card">
          <p class="card-label">${escapeHtml(prettyKey(key))}</p>
          <div class="result-raw">${renderInlineValue(value)}</div>
        </article>
      `
    )
    .join("");
  return `<div class="result-card-grid">${cards}</div>`;
}

function renderPairList(items, keyField, valueField) {
  if (!Array.isArray(items) || !items.length) {
    return `<div class="empty-state">暂无内容。</div>`;
  }
  return `<div class="result-detail-grid">${items
    .map(
      (item) => `
        <div class="result-mini-card">
          <strong>${escapeHtml(String(item?.[keyField] ?? ""))}</strong>
          <div class="result-raw">${renderInlineValue(item?.[valueField])}</div>
        </div>
      `
    )
    .join("")}</div>`;
}

function renderInterpretation(data) {
  const entries = normalizeEntries(data);
  if (!entries.length) {
    return `<div class="empty-state">暂无解释内容。</div>`;
  }

  return `<div class="result-detail-grid">${entries
    .map(
      ([key, value]) => `
        <div class="result-mini-card">
          <strong>${escapeHtml(prettyKey(key))}</strong>
          <div class="result-raw">${renderInlineValue(value)}</div>
        </div>
      `
    )
    .join("")}</div>`;
}

function renderBodyUse(data) {
  const entries = normalizeEntries(data);
  if (!entries.length) {
    return `<div class="empty-state">暂无体用关系内容。</div>`;
  }
  return `<div class="result-pair">${entries
    .map(
      ([key, value]) => `
        <div>
          <strong>${escapeHtml(prettyKey(key))}</strong>
          <div class="result-raw">${renderInlineValue(value)}</div>
        </div>
      `
    )
    .join("")}</div>`;
}

function renderTemplateCards(items) {
  if (!Array.isArray(items) || !items.length) {
    return `<div class="empty-state">暂无模板内容。</div>`;
  }
  return `<div class="result-list">${items
    .map(
      (item) => `
        <div class="result-list-item">
          <strong>${escapeHtml(String(item?.title ?? item?.label ?? ""))}</strong>
          <div class="result-raw">${renderInlineValue(item?.body ?? item?.value ?? item)}</div>
        </div>
      `
    )
    .join("")}</div>`;
}

function renderChipGrid(items) {
  if (!Array.isArray(items) || !items.length) {
    return `<div class="empty-state">暂无建议。</div>`;
  }
  return `<div class="result-chip-grid">${items
    .map((item) => `<span class="chip">${escapeHtml(String(item?.label ?? item?.title ?? item))}</span>`)
    .join("")}</div>`;
}

function renderTable(items, preferredKeys) {
  if (!Array.isArray(items) || !items.length) {
    return `<div class="empty-state">暂无表格数据。</div>`;
  }

  const keys = preferredKeys.length ? preferredKeys : Object.keys(items[0] || {});
  return `
    <div class="table-wrap">
      <table class="result-table">
        <thead>
          <tr>${keys.map((key) => `<th>${escapeHtml(prettyKey(key))}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  ${keys.map((key) => `<td>${renderInlineValue(item?.[key])}</td>`).join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderUnknownData(data) {
  if (data == null) {
    return `<div class="empty-state">暂无内容。</div>`;
  }
  return `<div class="result-raw">${renderInlineValue(data)}</div>`;
}

function renderInlineValue(value, depth = 0) {
  if (value == null) {
    return `<span class="muted">暂无</span>`;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return escapeHtml(String(value));
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return `<span class="muted">空数组</span>`;
    }
    if (depth >= 2) {
      return escapeHtml(JSON.stringify(value));
    }
    return `<div class="result-list">${value
      .map((item) => `<div class="result-list-item">${renderInlineValue(item, depth + 1)}</div>`)
      .join("")}</div>`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) {
      return `<span class="muted">空对象</span>`;
    }
    if (depth >= 2) {
      return escapeHtml(JSON.stringify(value));
    }
    return `<div class="result-pair">${entries
      .map(
        ([key, item]) => `
          <div>
            <strong>${escapeHtml(prettyKey(key))}</strong>
            <div>${renderInlineValue(item, depth + 1)}</div>
          </div>
        `
      )
      .join("")}</div>`;
  }
  return escapeHtml(String(value));
}

function normalizeEntries(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [];
  }
  return Object.entries(data);
}

function prettyKey(key) {
  return key
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll(/[_-]/g, " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function renderSuggestions(items) {
  aiSuggestions.innerHTML = items.map((item) => `<button class="suggestion-chip" type="button">${escapeHtml(item)}</button>`).join("");
}

function onSuggestionClick(event) {
  const target = event.target.closest(".suggestion-chip");
  if (!target) return;
  aiQuestion.value = target.textContent || "";
  aiQuestion.focus();
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

function toggleLiuyaoMode() {
  const mode = document.querySelector("#liuyao-casting-mode").value;
  const manual = document.querySelector("[data-liuyao-manual]");
  manual.hidden = mode !== "manual";
}

function randomizeLiuyaoLines() {
  const options = ["old-yin", "young-yang", "young-yin", "old-yang"];
  for (let index = 1; index <= 6; index += 1) {
    const select = document.querySelector(`#liuyao-line-${index}`);
    select.value = options[Math.floor(Math.random() * options.length)];
  }
}

function toggleMeihuaMode() {
  const mode = document.querySelector("#meihua-casting-mode").value;
  document.querySelector("[data-meihua-numbers]").hidden = mode !== "numbers";
  document.querySelector("[data-meihua-time]").hidden = mode !== "time";
}

function readNumber(selector) {
  const value = Number(document.querySelector(selector)?.value);
  return Number.isFinite(value) ? value : NaN;
}

function refreshForm() {
  form?.reset();
  if (page === "liuyao") {
    toggleLiuyaoMode();
  } else {
    toggleMeihuaMode();
  }
}

async function safeFetchCurrentUser() {
  try {
    return await fetchCurrentUser();
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
