import { authFetch } from "/session.js";

const form = document.querySelector("#compatibility-form");
const resultContainer = document.querySelector("#compatibility-result");
const aiChat = document.querySelector("#compatibility-ai-chat");
const aiQuestion = document.querySelector("#compatibility-ai-question");
const aiSend = document.querySelector("#compatibility-ai-send");
const aiSuggestions = document.querySelector("#compatibility-ai-suggestions");

let latestAiContext = null;
let chatHistory = [];

form.addEventListener("submit", onSubmit);
aiSend.addEventListener("click", onAiAsk);

renderSuggestionChips([
  "如果我们长期共事，谁更适合主导？",
  "这段关系最大的摩擦点在哪？",
  "同性情侣专项里最需要注意什么？",
  "未来一年关系适合推进还是观察？"
]);

async function onSubmit(event) {
  event.preventDefault();
  resultContainer.innerHTML = `<div class="empty-state">正在生成合盘结果，请稍候...</div>`;

  const payload = {
    relationType: document.querySelector("#relation-type").value,
    focusYear: Number(document.querySelector("#compat-focus-year").value),
    isVip: true,
    personA: {
      calendarType: "solar",
      birthDate: document.querySelector("#a-date").value,
      birthTime: document.querySelector("#a-time").value,
      gender: document.querySelector("#a-gender").value,
      birthPlace: document.querySelector("#a-place").value
    },
    personB: {
      calendarType: "solar",
      birthDate: document.querySelector("#b-date").value,
      birthTime: document.querySelector("#b-time").value,
      gender: document.querySelector("#b-gender").value,
      birthPlace: document.querySelector("#b-place").value
    }
  };

  try {
    const response = await authFetch("/api/v1/bazi/compatibility-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      resultContainer.innerHTML = `<div class="empty-state">${data.message || "生成失败"}</div>`;
      return;
    }

    const aiRes = await authFetch("/api/v1/bazi/compatibility-ai-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const aiData = await aiRes.json();
    latestAiContext = aiData.aiContext;
    chatHistory = [];

    renderCompatibility(data.result, data.view);
    aiChat.innerHTML =
      '<div class="chat-bubble assistant">合盘结果已更新。你现在可以继续追问关系稳定性、冲突点、共事分工、长期经营与专项场景判断。</div>';
    renderSuggestionChips([
      "我们更适合情感关系还是共事关系？",
      "这段关系最怕什么类型的摩擦？",
      "如果要长期合作，边界怎么设更稳？",
      "未来一年更适合推进还是保守观察？"
    ]);
  } catch (error) {
    resultContainer.innerHTML = `<div class="empty-state">${error.message || "生成失败"}</div>`;
  }
}

function renderCompatibility(result, view) {
  const dashboard = result.compatibilityDashboard;
  const dimensions = (dashboard.dimensions || [])
    .map(
      (item) => `
      <article class="dimension-card">
        <p class="card-label">${item.label}</p>
        <div class="display-value">${item.score}</div>
        <div class="meter"><span style="width:${item.score}%"></span></div>
      </article>
    `
    )
    .join("");

  const people = [
    { label: "人物 A", data: result.personA },
    { label: "人物 B", data: result.personB }
  ]
    .map(
      (item) => `
      <article class="person-compare-card">
        <div class="section-title">
          <h4>${item.label}</h4>
          <span class="chip">${item.data.dayMaster.label}</span>
        </div>
        <div class="list-stack">
          <div class="info-note">阳历：${item.data.calendar.solar}</div>
          <div class="info-note">农历：${item.data.calendar.lunar}</div>
          <div class="info-note">旺衰：${item.data.strengthAnalysis.levelLabel}</div>
          <div class="info-note">喜用：${item.data.strengthAnalysis.favorableElements.map((v) => v.name).join("、")}</div>
        </div>
      </article>
    `
    )
    .join("");

  const strengthCards = result.compatibilityCharts.strengthChart.series
    .map(
      (item) => `
      <article class="chart-card">
        <div class="section-title">
          <h4>${item.person} · ${item.level}</h4>
          <span class="chip">势差 ${item.delta.toFixed(2)}</span>
        </div>
        <div class="bar-line">
          <div class="bar-caption"><span>扶助力量</span><strong>${item.supportScore}</strong></div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.min(item.supportScore * 7, 100)}%; background:#9f5a2e;"></div></div>
        </div>
        <div class="bar-line" style="margin-top:10px;">
          <div class="bar-caption"><span>耗泄力量</span><strong>${item.drainScore}</strong></div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.min(item.drainScore * 7, 100)}%; background:#c59a3d;"></div></div>
        </div>
        <p class="muted" style="margin-top:12px;">${item.explanation}</p>
      </article>
    `
    )
    .join("");

  const fiveElements = result.compatibilityCharts.fiveElementContrast.elements
    .map(
      (item) => `
      <article class="chart-card">
        <div class="wuxing-compare-head">
          <span class="wuxing-chip"><span class="element-swatch" style="background:${item.colorHex}"></span>${item.element}</span>
          <span class="chip">A ${item.personA} · B ${item.personB}</span>
        </div>
        <div class="wuxing-compare-bars" style="margin-top:12px;">
          <div class="bar-line">
            <div class="bar-caption"><span>人物 A</span><strong>${item.personA}</strong></div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.min(item.personA * 30, 100)}%; background:${item.colorHex};"></div></div>
          </div>
          <div class="bar-line">
            <div class="bar-caption"><span>人物 B</span><strong>${item.personB}</strong></div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.min(item.personB * 30, 100)}%; background:${item.colorHex}; opacity:0.72;"></div></div>
          </div>
        </div>
        <p class="muted" style="margin-top:12px;">${item.explanation}</p>
      </article>
    `
    )
    .join("");

  const growthChips = result.compatibilityCharts.synergyMatrix.growth
    .map(
      (item) =>
        `<span class="wuxing-chip"><span class="element-swatch" style="background:${item.colorHex}"></span>${item.label}</span>`
    )
    .join("");

  const frictionChips = result.compatibilityCharts.synergyMatrix.friction
    .map(
      (item) =>
        `<span class="wuxing-chip"><span class="element-swatch" style="background:${item.colorHex}"></span>${item.label}</span>`
    )
    .join("");

  const narrativeHighlights = result.marketNarrative.highlights
    .map((item) => `<span class="chip">${item}</span>`)
    .join("");

  const synergyCards = Object.values(result.synergy)
    .map(
      (item) => `
      <article class="matrix-card">
        <h4>${item.title}</h4>
        <div class="two-column-text">
          <div>
            <p class="card-label">共振点</p>
            <ul class="vip-list">${item.resonance.map((line) => `<li>${line}</li>`).join("")}</ul>
          </div>
          <div>
            <p class="card-label">提醒</p>
            <div class="info-note">${item.caution}</div>
          </div>
          <div>
            <p class="card-label">建议</p>
            <div class="info-note">${item.suggestion}</div>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  const textPanels = result.compatibilityCharts.textualPanels.cards
    .map(
      (item) => `
      <article class="chart-card">
        <h4>${item.heading}</h4>
        <p class="muted">${item.body}</p>
      </article>
    `
    )
    .join("");

  const premiumCards = Object.values(result.premiumCompatibilityAnalysis.sections || {})
    .map(
      (section) => `
      <article class="vip-card">
        <h4>${section.title}</h4>
        <p>${section.summary}</p>
        <div class="three-grid" style="margin-top:12px;">
          <div>
            <p class="card-label">优势</p>
            <ul class="vip-list">${section.strengths.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div>
            <p class="card-label">风险</p>
            <ul class="vip-list">${section.risks.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div>
            <p class="card-label">建议</p>
            <ul class="vip-list">${section.suggestions.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  resultContainer.innerHTML = `
    <section class="section-block score-hero">
      <div class="hero-grid">
        <article>
          <p class="card-label">合盘评分</p>
          <div class="score-ring" style="--score:${dashboard.hero.score}">
            <div class="score-ring-value">
              <strong>${dashboard.hero.score}</strong>
              <span>协调分</span>
            </div>
          </div>
        </article>
        <article>
          <p class="card-label">关系等级</p>
          <div class="display-value">${result.pairSummary.compatibilityLevel}</div>
          <p class="hero-quote">${result.pairSummary.keyMessage}</p>
        </article>
        <article>
          <p class="card-label">关系主标题</p>
          <div class="display-value">${result.marketNarrative.headline}</div>
          <div class="tag-list" style="margin-top:12px;">${narrativeHighlights}</div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>合盘仪表板</h3>
        <span class="chip">${view.page.title}</span>
      </div>
      <div class="chart-grid">${dimensions}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>双方基础对照</h3>
        <div class="mini-list">
          <span class="chip">共通喜用：${result.pairSummary.sharedFavorableElements.map((item) => item.name).join("、") || "无"}</span>
          <span class="chip">摩擦元素：${result.pairSummary.frictionElements.map((item) => item.name).join("、") || "轻"}</span>
        </div>
      </div>
      <div class="person-compare-grid">${people}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>${result.compatibilityCharts.strengthChart.title}</h3>
        <span class="chip">旺衰对照</span>
      </div>
      <p class="muted">${result.compatibilityCharts.strengthChart.description}</p>
      <div class="chart-grid" style="margin-top:14px;">${strengthCards}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>${result.compatibilityCharts.fiveElementContrast.title}</h3>
        <span class="chip">五行图表</span>
      </div>
      <p class="muted">${result.compatibilityCharts.fiveElementContrast.description}</p>
      <div class="chart-grid" style="margin-top:14px;">${fiveElements}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>关系增益与摩擦矩阵</h3>
        <span class="chip">图文对照</span>
      </div>
      <div class="matrix-grid">
        <article class="matrix-card">
          <h4>共同增益</h4>
          <div class="tag-list">${growthChips || `<span class="chip">暂无明显共同增益</span>`}</div>
          <p class="muted" style="margin-top:12px;">
            ${result.compatibilityCharts.synergyMatrix.growth.map((item) => item.explanation).join(" ")}
          </p>
        </article>
        <article class="matrix-card">
          <h4>共同摩擦</h4>
          <div class="tag-list">${frictionChips || `<span class="chip">暂无明显共同摩擦</span>`}</div>
          <p class="muted" style="margin-top:12px;">
            ${result.compatibilityCharts.synergyMatrix.friction.map((item) => item.explanation).join(" ")}
          </p>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>关系协同</h3>
        <span class="chip">共事 / 情感 / 节奏</span>
      </div>
      <div class="card-grid">${synergyCards}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>图文讲解</h3>
        <span class="chip">为什么旺，哪里合</span>
      </div>
      <div class="chart-grid">${textPanels}</div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>VIP 深度分析</h3>
        <span class="chip">全部合盘内容为 VIP</span>
      </div>
      <div class="card-grid">${premiumCards}</div>
    </section>
  `;
}

async function onAiAsk() {
  if (!latestAiContext) {
    appendChat("assistant", "请先生成合盘结果，再开始咨询。");
    return;
  }

  const question = aiQuestion.value.trim();
  if (!question) return;

  appendChat("user", question);
  aiQuestion.value = "";

  try {
    const response = await authFetch("/api/v1/ai/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "bazi",
        sessionId: "compatibility-web-session",
        question,
        history: chatHistory,
        context: {
          module: "bazi",
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
    appendChat("assistant", error.message || "AI 咨询失败。");
  }
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
