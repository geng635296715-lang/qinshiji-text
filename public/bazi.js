const resultContainer = document.querySelector("#bazi-result");
const form = document.querySelector("#bazi-form");
const calendarType = document.querySelector("#calendar-type");
const solarFields = document.querySelector("#solar-fields");
const lunarFields = document.querySelector("#lunar-fields");
const lunarYearInput = document.querySelector("#lunar-year");
const lunarMonthSelect = document.querySelector("#lunar-month");
const lunarDaySelect = document.querySelector("#lunar-day");
const lunarHourSelect = document.querySelector("#lunar-hour");
const loadLunarButton = document.querySelector("#load-lunar");
const aiChat = document.querySelector("#bazi-ai-chat");
const aiQuestion = document.querySelector("#bazi-ai-question");
const aiSend = document.querySelector("#bazi-ai-send");
const aiSuggestions = document.querySelector("#bazi-ai-suggestions");

let latestAiContext = null;
let chatHistory = [];

calendarType.addEventListener("change", handleCalendarToggle);
lunarYearInput.addEventListener("change", () => loadLunarPicker());
lunarMonthSelect.addEventListener("change", () => loadLunarPicker());
loadLunarButton.addEventListener("click", () => loadLunarPicker());
form.addEventListener("submit", onSubmit);
aiSend.addEventListener("click", onAiAsk);

handleCalendarToggle();
loadLunarPicker();
renderSuggestionChips([
  "我最近事业推进该主动还是保守？",
  "今年感情上最需要注意什么？",
  "喜用神落到现实中应该怎么用？",
  "未来三个月哪段时间更适合做决定？"
]);

async function onSubmit(event) {
  event.preventDefault();
  resultContainer.innerHTML = `<div class="empty-state">正在生成八字结果，请稍候...</div>`;

  try {
    const payload = await buildAnalyzePayload();
    const response = await fetch("/api/v1/bazi/analyze-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      resultContainer.innerHTML = `<div class="empty-state">${data.message || "生成失败"}</div>`;
      return;
    }

    const aiContextResponse = await fetch("/api/v1/bazi/ai-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const aiContextData = await aiContextResponse.json();

    latestAiContext = aiContextData.aiContext;
    chatHistory = [];

    renderBaziResult(data.result, data.view);
    aiChat.innerHTML =
      '<div class="chat-bubble assistant">八字结果已更新。你现在可以继续追问事业、感情、财运、健康、流年流月和神煞落点等问题。</div>';
    renderSuggestionChips(
      latestAiContext?.suggestedQuestions || [
        "结合我的八字，这半年事业推进应该抓什么？",
        "我的情感模式最容易在哪个点卡住？",
        "流年流月里最要注意的高耗期是什么时候？"
      ]
    );
  } catch (error) {
    resultContainer.innerHTML = `<div class="empty-state">${error.message || "生成失败"}</div>`;
  }
}

function handleCalendarToggle() {
  const isLunar = calendarType.value === "lunar";
  solarFields.hidden = isLunar;
  lunarFields.hidden = !isLunar;
}

async function loadLunarPicker() {
  try {
    const year = Number(lunarYearInput.value || 1994);
    const month = Number(lunarMonthSelect.value || 1);
    const day = Number(lunarDaySelect.value || 1);
    const response = await fetch(`/api/v1/bazi/lunar-picker?year=${year}&month=${month}&day=${day}`);
    const data = await response.json();

    if (!response.ok) return;
    renderLunarPicker(data.result);
  } catch (error) {
    console.error(error);
  }
}

function renderLunarPicker(result) {
  lunarMonthSelect.innerHTML = result.months
    .map((item) => {
      const suffix = item.ganzhi ? ` · ${item.ganzhi}` : "";
      return `<option value="${item.value}" ${item.value === result.selected.month ? "selected" : ""}>${item.label}${item.isLeap ? "（闰）" : ""}${suffix}</option>`;
    })
    .join("");

  lunarDaySelect.innerHTML = result.days
    .map(
      (item) =>
        `<option value="${item.value}" ${item.value === result.selected.day ? "selected" : ""}>${item.label}</option>`
    )
    .join("");

  lunarHourSelect.innerHTML = result.hourOptions
    .map((item) => `<option value="${item.value}">${item.label} · ${item.range}</option>`)
    .join("");
}

async function buildAnalyzePayload() {
  if (calendarType.value === "solar") {
    return {
      calendarType: "solar",
      birthDate: document.querySelector("#birth-date").value,
      birthTime: document.querySelector("#birth-time").value,
      gender: document.querySelector("#gender").value,
      birthPlace: document.querySelector("#birth-place").value,
      focusYear: Number(document.querySelector("#focus-year").value),
      isVip: true
    };
  }

  const year = Number(lunarYearInput.value);
  const month = Number(lunarMonthSelect.value);
  const day = Number(lunarDaySelect.value);
  const birthTime = lunarHourSelect.value || "09:00";

  return {
    calendarType: "lunar",
    birthDate: `${year}-${month}-${String(day).padStart(2, "0")}`,
    birthTime,
    gender: document.querySelector("#gender").value,
    birthPlace: document.querySelector("#birth-place").value,
    focusYear: Number(document.querySelector("#focus-year").value),
    isVip: true
  };
}

function renderBaziResult(result, view) {
  const favorable = result.strengthAnalysis.favorableElements || [];
  const unfavorable = result.strengthAnalysis.unfavorableElements || [];
  const maxWuxing = Math.max(...result.wuXingStats.map((item) => item.count), 1);

  const summaryCards = (view.header?.summaryCards || [])
    .map(
      (item) => `
      <article class="result-card">
        <p class="card-label">${item.label}</p>
        <div class="display-value" style="color:${item.accent}">${item.value}</div>
        <div class="muted">${item.description || ""}</div>
      </article>
    `
    )
    .join("");

  const pillarCards = result.pillars
    .map(
      (pillar) => `
      <article class="pillar-card">
        <div class="pillar-head">
          <p class="card-label">${pillarLabel(pillar.name)}</p>
          <span class="chip">${pillar.naYin}</span>
        </div>
        <div class="pillar-ganzhi">${pillar.ganzhi}</div>
        <div class="element-line">
          ${wuxingChip(pillar.heavenlyStem)}
          ${wuxingChip(pillar.earthlyBranch)}
        </div>
        <div class="mini-list" style="margin-top:10px;">
          ${pillar.hiddenStems.map((item) => wuxingChip(item)).join("")}
        </div>
        <div class="two-column-text" style="margin-top:10px;">
          <div class="info-note">十神：${pillar.shiShenStem} / ${pillar.shiShenBranch.join("、")}</div>
          <div class="info-note">地势：${pillar.diShi} · 旬空：${pillar.xunKong}</div>
        </div>
      </article>
    `
    )
    .join("");

  const wuxingBars = result.wuXingStats
    .map(
      (item) => `
      <div class="wuxing-compare-row">
        <div class="wuxing-compare-head">
          <span class="wuxing-chip"><span class="element-swatch" style="background:${item.colorHex}"></span>${item.name}</span>
          <strong>${item.count}</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(item.count / maxWuxing) * 100}%; background:${item.colorHex};"></div>
        </div>
      </div>
    `
    )
    .join("");

  const yearlyCards = (result.flowAdvanced.yearlyScores || [])
    .map(
      (item) => `
      <article class="flow-card">
        <p class="card-label">${item.year} 年 · ${item.ganzhi}</p>
        <div class="display-value ${toneClass(item.tone)}">${item.score}</div>
        <div class="meter"><span style="width:${item.score}%"></span></div>
        <p class="muted">${item.note}</p>
      </article>
    `
    )
    .join("");

  const monthRows = (result.flowAdvanced.monthlyScores || [])
    .map(
      (item) => `
      <tr class="${item.score >= 80 ? "flow-row-highlight" : ""}">
        <td>${item.month}</td>
        <td>${item.ganzhi}</td>
        <td>${item.score}</td>
        <td class="${toneClass(item.tone)}">${toneText(item.tone)}</td>
        <td>${item.note}</td>
      </tr>
    `
    )
    .join("");

  const shenshaCards = (result.shenShaAnalysis.items || [])
    .map(
      (item) => `
      <article class="shensha-card">
        <div class="section-title">
          <h4>${item.name}</h4>
          <span class="chip">${item.importance}</span>
        </div>
        <p class="muted">命中柱位：${item.matchedPillars.join("、")}</p>
        <p>${item.meaning}</p>
        <div class="info-note">${item.advice}</div>
      </article>
    `
    )
    .join("");

  const premiumCards = Object.values(result.premiumAnalysis.sections || {})
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
    <section class="section-block">
      <div class="section-title">
        <div>
          <p class="section-kicker">八字结果</p>
          <h2>${view.page.title}</h2>
        </div>
        <div class="mini-list">
          <span class="chip">${result.dayMaster.label}</span>
          <span class="chip">${result.strengthAnalysis.levelLabel}</span>
          <span class="chip">${result.calendar.lunar}</span>
        </div>
      </div>

      <div class="summary-grid">${summaryCards}</div>
    </section>

    <section class="section-block score-hero">
      <div class="hero-grid">
        <article>
          <p class="card-label">命盘主判断</p>
          <div class="hero-score">${result.strengthAnalysis.delta.toFixed(2)} <small>势差</small></div>
          <p class="hero-quote">${result.strengthAnalysis.reasoning}</p>
        </article>
        <article>
          <p class="card-label">喜用方向</p>
          <div class="tag-list">${favorable.map((item) => wuxingChip(item)).join("")}</div>
          <div class="info-note" style="margin-top:12px;">${result.overview.favorableUsage}</div>
        </article>
        <article>
          <p class="card-label">忌神提醒</p>
          <div class="tag-list">${unfavorable.map((item) => wuxingChip(item)).join("")}</div>
          <div class="info-note" style="margin-top:12px;">${result.overview.wuxingBalanceHint}</div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>四柱命盘</h3>
        <span class="chip">${result.calendar.solar}</span>
      </div>
      <div class="pillars">${pillarCards}</div>
    </section>

    <section class="section-block chart-grid">
      <article class="chart-card">
        <div class="section-title">
          <h3>五行比例图</h3>
          <span class="chip">${result.calendar.zodiac}</span>
        </div>
        <div class="wuxing-list">${wuxingBars}</div>
      </article>

      <article class="chart-card">
        <div class="section-title">
          <h3>盘面摘要</h3>
          <span class="chip">${result.calendar.season}</span>
        </div>
        <div class="list-stack">
          <div class="info-note">太元：${result.chartMeta.taiYuan.value} · ${result.chartMeta.taiYuan.naYin}</div>
          <div class="info-note">胎息：${result.chartMeta.taiXi.value} · ${result.chartMeta.taiXi.naYin}</div>
          <div class="info-note">命宫：${result.chartMeta.mingGong.value} · ${result.chartMeta.mingGong.naYin}</div>
          <div class="info-note">身宫：${result.chartMeta.shenGong.value} · ${result.chartMeta.shenGong.naYin}</div>
          <div class="info-note">${result.overview.displayNote}</div>
        </div>
      </article>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>神煞总览</h3>
        <span class="chip">${result.shenShaAnalysis.items.length} 项</span>
      </div>
      <div class="summary-band">
        <div>
          <p class="card-label">总提示</p>
          <div>${result.shenShaAnalysis.summary}</div>
        </div>
      </div>
      <div class="card-grid" style="margin-top:16px;">
        ${shenshaCards || `<div class="empty-state">当前命盘未返回明显神煞命中。</div>`}
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <div>
          <h3>专业流运节奏</h3>
          <p class="muted">${result.flowAdvanced.strategySummary}</p>
        </div>
        <div class="mini-list">
          <span class="chip">${result.flowAdvanced.currentDaYunHeadline}</span>
          <span class="chip">${result.flowAdvanced.currentYearHeadline}</span>
        </div>
      </div>
      <div class="flow-grid">
        ${yearlyCards}
      </div>
      <div class="table-wrap" style="margin-top:16px;">
        <table class="flow-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>干支</th>
              <th>分数</th>
              <th>语气</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>${monthRows}</tbody>
        </table>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h3>VIP 专项解读</h3>
        <span class="chip">已解锁</span>
      </div>
      <div class="card-grid">${premiumCards}</div>
    </section>
  `;
}

async function onAiAsk() {
  if (!latestAiContext) {
    appendChat("assistant", "请先生成八字结果，再开始咨询。");
    return;
  }

  const question = aiQuestion.value.trim();
  if (!question) return;

  appendChat("user", question);
  aiQuestion.value = "";

  try {
    const response = await fetch("/api/v1/ai/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "bazi",
        sessionId: "bazi-web-session",
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

  const div = document.createElement("div");
  div.className = `chat-bubble ${role}`;
  div.textContent = content;
  aiChat.appendChild(div);
  aiChat.scrollTop = aiChat.scrollHeight;
}

function pillarLabel(name) {
  if (name === "year") return "年柱";
  if (name === "month") return "月柱";
  if (name === "day") return "日柱";
  return "时柱";
}

function wuxingChip(item) {
  return `<span class="wuxing-chip"><span class="element-swatch" style="background:${item.colorHex}"></span>${item.value || item.name} · ${item.colorName}</span>`;
}

function toneClass(tone) {
  if (tone === "good") return "tone-good";
  if (tone === "care") return "tone-care";
  return "tone-neutral";
}

function toneText(tone) {
  if (tone === "good") return "顺势";
  if (tone === "care") return "注意";
  return "中性";
}
