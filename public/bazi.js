import { authFetch, fetchCurrentUser } from "/session.js";

const LOCAL_ARCHIVE_KEY = "qingzhiji-local-bazi-archives";
const LOCAL_SELECTED_ARCHIVE_KEY = "qingzhiji-selected-bazi-archive";

const resultContainer = document.querySelector("#bazi-result");
const FLOW_ACCESS_MODE_OVERRIDE = "free"; // "normal" | "vip" | "free"
const openArchivePickerButton = document.querySelector("#open-archive-picker");
const openArchivePickerHeaderButton = document.querySelector("#open-archive-picker-header");
const generateFromSelectedButton = document.querySelector("#generate-from-selected");
const selectedArchiveName = document.querySelector("#selected-archive-name");
const selectedArchiveDetail = document.querySelector("#selected-archive-detail");

const archivePickerModal = document.querySelector("#archive-picker-modal");
const closeArchivePickerButton = document.querySelector("#close-archive-picker");
const archiveList = document.querySelector("#archive-list");
const archiveSidebarListPanel = document.querySelector("#archive-sidebar-list");
const openCreateArchiveButton = document.querySelector("#open-create-archive");
const openCreateArchiveInlineButton = document.querySelector("#open-create-archive-inline");
const confirmArchiveSelectionButton = document.querySelector("#confirm-archive-selection");

const archiveCreateModal = document.querySelector("#archive-create-modal");
const closeCreateArchiveButton = document.querySelector("#close-create-archive");
const archiveCreateForm = document.querySelector("#archive-create-form");
const archiveCreateMessage = document.querySelector("#archive-create-message");
const archiveCreateTitle = document.querySelector("#archive-create-title");
const archiveCreateSubmit = document.querySelector("#archive-create-submit");

const archiveCalendarType = document.querySelector("#archive-calendar-type");
const archiveSolarFields = document.querySelector("#archive-solar-fields");
const archiveLunarFields = document.querySelector("#archive-lunar-fields");
const archiveLunarYearInput = document.querySelector("#archive-lunar-year");
const archiveLunarMonthSelect = document.querySelector("#archive-lunar-month");
const archiveLunarDaySelect = document.querySelector("#archive-lunar-day");
const archiveLunarHourSelect = document.querySelector("#archive-lunar-hour");

const aiChat = document.querySelector("#bazi-ai-chat");
const aiQuestion = document.querySelector("#bazi-ai-question");
const aiSend = document.querySelector("#bazi-ai-send");
const aiSuggestions = document.querySelector("#bazi-ai-suggestions");
const aiPanel = document.querySelector(".bazi-ai-panel");
const aiHero = document.querySelector("#bazi-ai-hero");
const AI_REPLY_CHAR_LIMIT = 1000;

const STEM_META = {
  甲: { wuxing: "木", colorHex: "#2F9E44", yang: true },
  乙: { wuxing: "木", colorHex: "#2F9E44", yang: false },
  丙: { wuxing: "火", colorHex: "#D94841", yang: true },
  丁: { wuxing: "火", colorHex: "#D94841", yang: false },
  戊: { wuxing: "土", colorHex: "#C27C2C", yang: true },
  己: { wuxing: "土", colorHex: "#C27C2C", yang: false },
  庚: { wuxing: "金", colorHex: "#C9A227", yang: true },
  辛: { wuxing: "金", colorHex: "#C9A227", yang: false },
  壬: { wuxing: "水", colorHex: "#2B6CB0", yang: true },
  癸: { wuxing: "水", colorHex: "#2B6CB0", yang: false }
};

const BRANCH_META = {
  子: { wuxing: "水", colorHex: "#2B6CB0" },
  丑: { wuxing: "土", colorHex: "#C27C2C" },
  寅: { wuxing: "木", colorHex: "#2F9E44" },
  卯: { wuxing: "木", colorHex: "#2F9E44" },
  辰: { wuxing: "土", colorHex: "#C27C2C" },
  巳: { wuxing: "火", colorHex: "#D94841" },
  午: { wuxing: "火", colorHex: "#D94841" },
  未: { wuxing: "土", colorHex: "#C27C2C" },
  申: { wuxing: "金", colorHex: "#C9A227" },
  酉: { wuxing: "金", colorHex: "#C9A227" },
  戌: { wuxing: "土", colorHex: "#C27C2C" },
  亥: { wuxing: "水", colorHex: "#2B6CB0" }
};

const BRANCH_HIDDEN_STEMS = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"]
};

const STEM_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const CHANG_SHENG_ORDER = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
const CHANG_SHENG_OFFSET = { 甲: 1, 丙: 10, 戊: 10, 庚: 7, 壬: 4, 乙: 6, 丁: 9, 己: 9, 辛: 0, 癸: 3 };
const NAYIN_MAP = {
  甲子: "海中金", 乙丑: "海中金", 丙寅: "炉中火", 丁卯: "炉中火", 戊辰: "大林木", 己巳: "大林木",
  庚午: "路旁土", 辛未: "路旁土", 壬申: "剑锋金", 癸酉: "剑锋金", 甲戌: "山头火", 乙亥: "山头火",
  丙子: "涧下水", 丁丑: "涧下水", 戊寅: "城头土", 己卯: "城头土", 庚辰: "白蜡金", 辛巳: "白蜡金",
  壬午: "杨柳木", 癸未: "杨柳木", 甲申: "泉中水", 乙酉: "泉中水", 丙戌: "屋上土", 丁亥: "屋上土",
  戊子: "霹雳火", 己丑: "霹雳火", 庚寅: "松柏木", 辛卯: "松柏木", 壬辰: "长流水", 癸巳: "长流水",
  甲午: "沙中金", 乙未: "沙中金", 丙申: "山下火", 丁酉: "山下火", 戊戌: "平地木", 己亥: "平地木",
  庚子: "壁上土", 辛丑: "壁上土", 壬寅: "金箔金", 癸卯: "金箔金", 甲辰: "覆灯火", 乙巳: "覆灯火",
  丙午: "天河水", 丁未: "天河水", 戊申: "大驿土", 己酉: "大驿土", 庚戌: "钗钏金", 辛亥: "钗钏金",
  壬子: "桑柘木", 癸丑: "桑柘木", 甲寅: "大溪水", 乙卯: "大溪水", 丙辰: "沙中土", 丁巳: "沙中土",
  戊午: "天上火", 己未: "天上火", 庚申: "石榴木", 辛酉: "石榴木", 壬戌: "大海水", 癸亥: "大海水"
};

let currentUser = null;
let archives = [];
let pendingArchiveId = "";
let selectedArchive = null;
let latestAiContext = null;
let chatHistory = [];
let editingArchiveId = null;
let aiFocused = false;
let latestRenderedBaziResult = null;
let flowPanelState = { dayun: 0, liunian: 0, liuyue: 0 };
let flowAiInsightCache = { dayun: {}, liunian: {}, liuyue: {} };
let flowReferenceAiCache = { dayun: {}, liunian: {}, liuyue: {} };
let flowAiInsightLoading = new Set();
let aiSuggestionItems = [];
let aiSuggestionIndex = 0;
let aiSuggestionTimer = null;
let aiSuggestionAnimating = false;
let moduleEnterViewportObserver = null;
let moduleEnterResultObserver = null;
let pageShellAnimationBootstrapped = false;

const BORDER_GLOW_SELECTORS = [
  ".panel-card",
  ".bazi-archive-list-box",
  ".bazi-sidebar-list .archive-card",
  ".section-block",
  ".bazi-workbench-pane",
  ".result-card",
  ".board-quick-grid .result-card",
  ".flow-reference-section",
  ".flow-mini-card",
  ".flow-compare-card",
  ".wuxing-stats-card",
  ".wuxing-strength-card",
  ".flow-insight-panel",
  ".matching-daymaster-card",
  ".vip-card",
  ".bazi-ai-chat-wrap",
  ".bazi-ai-askbox",
  ".bazi-compat-switch",
  ".archive-card",
  ".archive-card-manager",
  ".modal-card .ghost-btn",
  ".modal-card .primary-btn",
  ".bazi-home-nav .home-login-entry .account-menu-trigger",
  ".bazi-home-nav .home-login-entry .outline-pill"
];

openArchivePickerButton?.addEventListener("click", onOpenArchivePicker);
openArchivePickerHeaderButton?.addEventListener("click", onOpenArchivePicker);
closeArchivePickerButton.addEventListener("click", () => setModalOpen(archivePickerModal, false));
openCreateArchiveButton.addEventListener("click", onOpenCreateArchive);
openCreateArchiveInlineButton?.addEventListener("click", onOpenCreateArchive);
closeCreateArchiveButton.addEventListener("click", () => setModalOpen(archiveCreateModal, false));
confirmArchiveSelectionButton.addEventListener("click", confirmArchiveSelection);
generateFromSelectedButton.addEventListener("click", generateFromSelectedArchive);
archiveCreateForm.addEventListener("submit", onCreateArchive);
archiveCalendarType.addEventListener("change", handleArchiveCalendarToggle);
archiveLunarYearInput.addEventListener("change", () => loadArchiveLunarPicker());
archiveLunarMonthSelect.addEventListener("change", () => loadArchiveLunarPicker());
aiSend.addEventListener("click", onAiAsk);
aiQuestion.addEventListener("input", syncAiPanelState);
aiQuestion.addEventListener("focus", () => {
  aiFocused = true;
  syncAiPanelState();
});
aiQuestion.addEventListener("blur", () => {
  aiFocused = false;
  syncAiPanelState();
});
archivePickerModal.addEventListener("click", onOverlayClick);
archiveCreateModal.addEventListener("click", onOverlayClick);
archiveSidebarListPanel?.addEventListener("click", onArchiveSidebarListClick);
archiveList?.addEventListener("click", onArchiveListClick);
resultContainer?.addEventListener("click", onResultPanelClick);
document.addEventListener("keydown", onKeydownCloseModal);

renderSuggestionChips([
  "我今年的整体运势重点在哪里？",
  "这张盘更适合先稳住还是主动突破？",
  "感情和事业哪个更该优先处理？",
  "喜用五行在现实里应该怎么落地？"
]);

handleArchiveCalendarToggle();
loadArchiveLunarPicker();
syncAiPanelState();
queueBorderGlowRefresh({ animateModules: true, scope: "shell" });
bootstrap();

async function bootstrap() {
  currentUser = await fetchCurrentUser();
  await loadArchives();
  restoreSelectedArchive();
}

async function loadArchives() {
  const localArchives = readLocalArchives();

  if (!currentUser) {
    archives = localArchives;
    renderArchiveList();

    if (!pendingArchiveId && archives.length) {
      pendingArchiveId = archives[0].id;
    }
    applyPendingHighlight();
    renderArchiveHint();
    return;
  }

  try {
    const response = await authFetch("/api/v1/user-center/bazi-archives");
    const data = await response.json();

    if (!response.ok) {
      archives = localArchives;
      renderArchiveList();
      renderArchiveHint();
      return;
    }

    archives = mergeArchives(localArchives, data.archives || []);
  } catch (error) {
    archives = localArchives;
  }

  renderArchiveList();

  if (!pendingArchiveId && archives.length) {
    pendingArchiveId = archives[0].id;
  }
  applyPendingHighlight();
  renderArchiveHint();
}

async function onAiAsk() {
  if (!latestAiContext) {
    appendChat("assistant", "请先生成八字结果，再开始咨询。");
    return;
  }

  const question = aiQuestion.value.trim();
  if (!question) {
    return;
  }

  appendChat("user", question);
  aiQuestion.value = "";
  syncAiPanelState();
  const pendingBubble = appendPendingChat();
  const questionForAi = `${question}\n\n请严格基于当前页面排盘明细的所有内容与流运对照的所有内容直接作答：回答要求为精准、简短、完整，控制在1000字以内；只给最直接的答案与最终结果，不要解释原因，不要展开过程，不要重复，不要输出与问题无关的套话。`;

  try {
    const response = await authFetch("/api/v1/ai/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "bazi",
        sessionId: "bazi-web-session",
        question: questionForAi,
        maxTokens: 360,
        temperature: 0.38,
        history: chatHistory,
        context: {
          module: "bazi",
          aiContext: latestAiContext
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      resolvePendingChat(pendingBubble, data.message || "AI 咨询失败。");
      return;
    }

    resolvePendingChat(pendingBubble, data.result.answer);
  } catch (error) {
    resolvePendingChat(pendingBubble, error instanceof Error ? error.message : "AI 咨询失败。");
  }
}

function renderSuggestionChips(items) {
  aiSuggestionItems = (items || []).slice(0, 4);
  aiSuggestionIndex = 0;
  stopAiSuggestionTicker();
  renderAiSuggestionTicker(false);
  startAiSuggestionTicker();
}

function normalizeAiReply(content) {
  const compact = String(content || "").replace(/\n{3,}/g, "\n\n").trim();
  if (compact.length <= AI_REPLY_CHAR_LIMIT) {
    return compact;
  }

  return `${compact.slice(0, AI_REPLY_CHAR_LIMIT).trim()}…`;
}

function appendChat(role, content, options = {}) {
  const { skipHistory = false } = options;
  const normalizedContent = role === "assistant" ? normalizeAiReply(content) : String(content || "").trim();

  if (role === "user" || role === "assistant") {
    if (!skipHistory && normalizedContent) {
      chatHistory.push({ role, content: normalizedContent });
    }
  }

  const div = document.createElement("div");
  div.className = `chat-bubble ${role}`;
  div.textContent = normalizedContent;
  aiChat.appendChild(div);
  aiChat.scrollTop = aiChat.scrollHeight;
  syncAiPanelState();
  return div;
}

function appendPendingChat() {
  const div = document.createElement("div");
  div.className = "chat-bubble assistant pending";
  div.innerHTML = `
    <span class="pending-label">等待信息反馈</span>
    <span class="pending-dots" aria-hidden="true">
      <span>.</span><span>.</span><span>.</span>
    </span>
  `;
  aiChat.appendChild(div);
  aiChat.scrollTop = aiChat.scrollHeight;
  syncAiPanelState();
  return div;
}

function resolvePendingChat(node, content) {
  if (!node || !aiChat.contains(node)) {
    appendChat("assistant", content);
    return;
  }

  const normalizedContent = normalizeAiReply(content || "AI 咨询失败。");
  node.className = "chat-bubble assistant";
  node.textContent = normalizedContent;
  chatHistory.push({ role: "assistant", content: normalizedContent });
  aiChat.scrollTop = aiChat.scrollHeight;
  syncAiPanelState();
}

function clearAiIntroBubble() {
  aiChat.querySelectorAll(".intro-bubble").forEach((node) => node.remove());
}

function syncAiPanelState() {
  if (!aiPanel) {
    return;
  }

  const hasTypedInput = aiQuestion.value.trim().length > 0;
  const hasConversation = chatHistory.length > 0 || aiChat.children.length > 1;
  const isEngaged = aiFocused || hasTypedInput || hasConversation;
  aiPanel.classList.toggle("is-chatting", isEngaged);
  aiHero?.setAttribute("aria-hidden", isEngaged ? "true" : "false");
}

function renderAiSuggestionTicker(animate = false) {
  if (!aiSuggestions) return;
  if (!aiSuggestionItems.length) {
    aiSuggestions.innerHTML = "";
    return;
  }

  const current = aiSuggestionItems[aiSuggestionIndex % aiSuggestionItems.length];
  const next = aiSuggestionItems[(aiSuggestionIndex + 1) % aiSuggestionItems.length];
  aiSuggestions.innerHTML = `
    <div class="bazi-ai-suggestion-viewport ${animate ? "is-animating" : ""}">
      <button class="bazi-ai-suggestion-line is-current" type="button">${escapeHtml(current)}</button>
      <button class="bazi-ai-suggestion-line is-next" type="button">${escapeHtml(next)}</button>
    </div>
  `;

  aiSuggestions.querySelectorAll(".bazi-ai-suggestion-line").forEach((button, index) => {
    button.addEventListener("click", () => {
      const text = index === 0 ? current : next;
      aiQuestion.value = text;
      aiQuestion.focus();
      syncAiPanelState();
    });
  });
}

function rotateAiSuggestionTicker() {
  if (aiSuggestionAnimating || aiSuggestionItems.length < 2) return;
  aiSuggestionAnimating = true;
  renderAiSuggestionTicker(true);
  window.setTimeout(() => {
    aiSuggestionIndex = (aiSuggestionIndex + 1) % aiSuggestionItems.length;
    renderAiSuggestionTicker(false);
    aiSuggestionAnimating = false;
  }, 640);
}

function startAiSuggestionTicker() {
  if (aiSuggestionItems.length < 2) return;
  stopAiSuggestionTicker();
  aiSuggestionTimer = window.setInterval(() => {
    if (!aiPanel?.classList.contains("is-chatting")) {
      rotateAiSuggestionTicker();
    }
  }, 5000);
}

function stopAiSuggestionTicker() {
  if (aiSuggestionTimer) {
    window.clearInterval(aiSuggestionTimer);
    aiSuggestionTimer = null;
  }
}

function queueBorderGlowRefresh(options = {}) {
  const normalized =
    typeof options === "boolean"
      ? { animateModules: options, scope: "all" }
      : {
          animateModules: options.animateModules ?? true,
          scope: options.scope ?? "all"
        };
  window.requestAnimationFrame(() => {
    refreshBorderGlowSurfaces(normalized);
    if (normalized.scope === "shell" && normalized.animateModules && !pageShellAnimationBootstrapped) {
      pageShellAnimationBootstrapped = true;
    }
  });
}

function refreshBorderGlowSurfaces({ animateModules = true, scope = "all" } = {}) {
  const seen = new Set();
  const elements = [];

  BORDER_GLOW_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!(element instanceof HTMLElement) || seen.has(element)) return;
      if (scope === "shell" && isResultAnimatedElement(element)) return;
      if (scope === "result" && !isResultAnimatedElement(element)) return;
      seen.add(element);
      elements.push(element);
    });
  });

  elements.forEach((element, index) => {
    enhanceBorderGlowSurface(element, index, animateModules, scope);
  });
}

function isResultAnimatedElement(element) {
  return resultContainer instanceof HTMLElement && resultContainer.contains(element);
}

function createModuleEnterObserver(root) {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        if (!(element instanceof HTMLElement)) return;
        element.classList.add("is-visible");
        if (root) {
          moduleEnterResultObserver?.unobserve(element);
        } else {
          moduleEnterViewportObserver?.unobserve(element);
        }
      });
    },
    {
      root,
      rootMargin: root ? "0px 0px 28% 0px" : "0px 0px -10% 0px",
      threshold: root ? 0.01 : 0.05
    }
  );
}

function observeModuleEnter(element) {
  const useResultRoot =
    resultContainer instanceof HTMLElement &&
    resultContainer.contains(element) &&
    !element.isSameNode(resultContainer);

  if (useResultRoot) {
    if (!moduleEnterResultObserver) {
      moduleEnterResultObserver = createModuleEnterObserver(resultContainer);
    }
    moduleEnterResultObserver.observe(element);
    return;
  }

  if (!moduleEnterViewportObserver) {
    moduleEnterViewportObserver = createModuleEnterObserver(null);
  }
  moduleEnterViewportObserver.observe(element);
}

function enhanceBorderGlowSurface(element, index = 0, animateModules = true, scope = "all") {
  if (!(element instanceof HTMLElement)) return;

  element.classList.add("border-glow-surface");

  if (!element.querySelector(":scope > .border-glow-edge-light")) {
    const edgeLight = document.createElement("span");
    edgeLight.className = "border-glow-edge-light";
    edgeLight.setAttribute("aria-hidden", "true");
    element.appendChild(edgeLight);
  }

  const shouldAnimate =
    animateModules &&
    (
      scope === "result" ||
      (scope === "shell" && !pageShellAnimationBootstrapped) ||
      scope === "all"
    );

  element.classList.remove("module-enter", "is-visible");
  element.style.removeProperty("animation");

  if (shouldAnimate) {
    element.style.setProperty("--module-enter-delay", `${Math.min(index * 55, 720)}ms`);
    element.classList.add("module-enter");
    observeModuleEnter(element);
  } else {
    element.dataset.moduleEnterBound = "static";
    element.style.removeProperty("--module-enter-delay");
    element.style.opacity = "1";
    element.style.transform = "translate3d(0, 0, 0) scale(1)";
    element.style.filter = "none";
  }

  if (element.dataset.borderGlowReady === "true") {
    return;
  }

  element.dataset.borderGlowReady = "true";

  const getCenter = () => {
    const rect = element.getBoundingClientRect();
    return [rect.width / 2, rect.height / 2];
  };

  const getEdgeProximity = (x, y) => {
    const [cx, cy] = getCenter();
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  };

  const getCursorAngle = (x, y) => {
    const [cx, cy] = getCenter();
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  };

  element.addEventListener("pointermove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edge = getEdgeProximity(x, y);
    const angle = getCursorAngle(x, y);
    element.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`);
    element.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
  });

  element.addEventListener("pointerleave", () => {
    element.style.setProperty("--edge-proximity", "0");
  });
}

function onArchiveSidebarListClick(event) {
  const actionEdit = event.target.closest("[data-archive-edit]");
  if (actionEdit) {
    event.preventDefault();
    event.stopPropagation();
    onEditArchive(actionEdit.getAttribute("data-archive-edit"));
    return;
  }

  const actionDelete = event.target.closest("[data-archive-delete]");
  if (actionDelete) {
    event.preventDefault();
    event.stopPropagation();
    onDeleteArchive(actionDelete.getAttribute("data-archive-delete"));
    return;
  }

  const card = event.target.closest("[data-archive-id]");
  if (!card || !archiveSidebarListPanel?.contains(card)) {
    return;
  }

  selectArchiveFromUi(card.getAttribute("data-archive-id"));
}

function onArchiveListClick(event) {
  const editButton = event.target.closest("[data-archive-edit]");
  if (editButton) {
    onEditArchive(editButton.getAttribute("data-archive-edit"));
    return;
  }

  const deleteButton = event.target.closest("[data-archive-delete]");
  if (deleteButton) {
    onDeleteArchive(deleteButton.getAttribute("data-archive-delete"));
    return;
  }

  const selectButton = event.target.closest("[data-archive-select]");
  if (selectButton) {
    selectArchiveFromUi(selectButton.getAttribute("data-archive-select"));
  }
}

function onResultPanelClick(event) {
  const generateButton = event.target.closest("[data-flow-insight-generate]");
  if (generateButton && latestRenderedBaziResult) {
    const section = generateButton.getAttribute("data-flow-insight-generate");
    const force = generateButton.getAttribute("data-flow-generate-force") === "retry";
    generateFlowInsightAiForSection(section, { force });
    return;
  }

  const navButton = event.target.closest("[data-flow-panel-nav]");
  if (!navButton || !latestRenderedBaziResult) {
    return;
  }

  const section = navButton.getAttribute("data-flow-panel-nav");
  const direction = navButton.getAttribute("data-flow-direction") === "prev" ? -1 : 1;
  const items = getFlowPanelItems(latestRenderedBaziResult, section);
  if (!items.length) {
    return;
  }

  const currentIndex = flowPanelState[section] ?? 0;
  const nextIndex = (currentIndex + direction + items.length) % items.length;
  flowPanelState = { ...flowPanelState, [section]: nextIndex };
  renderBaziResult(latestRenderedBaziResult, { preserveFlowPanelState: true });
}

function readLocalArchives() {
  try {
    const raw = localStorage.getItem(LOCAL_ARCHIVE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeArchiveRecord).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function writeLocalArchives(list) {
  localStorage.setItem(LOCAL_ARCHIVE_KEY, JSON.stringify(list));
}

function normalizeArchiveRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const profile = record.profile && typeof record.profile === "object" ? record.profile : record;
  const id = String(record.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const nickname = String(record.nickname || profile.nickname || "未命名档案");
  const now = new Date().toISOString();

  return {
    id,
    nickname,
    calendarType: profile.calendarType === "lunar" ? "lunar" : "solar",
    birthDate: String(profile.birthDate || ""),
    birthTime: String(profile.birthTime || "09:00"),
    gender: profile.gender === "male" || profile.gender === "female" || profile.gender === "other" ? profile.gender : "other",
    birthPlace: String(profile.birthPlace || ""),
    note: profile.note ? String(profile.note) : "",
    savedAt: String(record.savedAt || record.updatedAt || now),
    updatedAt: String(record.updatedAt || record.savedAt || now)
  };
}

function mergeArchives(localArchives, remoteArchives) {
  const merged = new Map();
  for (const archive of localArchives) {
    merged.set(archive.id, archive);
  }
  for (const archive of remoteArchives) {
    const normalized = normalizeArchiveRecord(archive);
    if (normalized) {
      merged.set(normalized.id, normalized);
    }
  }
  return [...merged.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function renderArchiveList() {
  const sidebarTarget = archiveSidebarListPanel;
  const modalTarget = archiveList;
  const sidebarArchives = archives.slice(0, 6);

  if (sidebarTarget) {
    sidebarTarget.innerHTML = sidebarArchives.length
      ? sidebarArchives.map((archive) => renderArchiveSidebarCard(archive)).join("")
      : '<div class="empty-state">暂无档案，请先新增一条基础信息。</div>';
  }

  if (modalTarget) {
    modalTarget.innerHTML = archives.length
      ? archives.map((archive) => renderArchiveManagerCard(archive)).join("")
      : '<div class="empty-state">当前还没有八字档案，点击“新增信息”开始创建。</div>';
  }

  applyPendingHighlight();
  queueBorderGlowRefresh({ animateModules: false, scope: "shell" });
}

function renderArchiveSidebarCard(archive) {
  const isActive = archive.id === pendingArchiveId || archive.id === selectedArchive?.id;
  return `
    <div class="archive-card ${isActive ? "is-active" : ""}" role="button" tabindex="0" data-archive-id="${escapeHtml(archive.id)}">
      <span class="archive-card-hover-actions" aria-hidden="true">
        <button class="archive-hover-icon archive-hover-icon-edit" type="button" title="修改信息" aria-label="修改信息" data-archive-edit="${escapeHtml(archive.id)}">✎</button>
        <button class="archive-hover-icon archive-hover-icon-delete" type="button" title="删除卡片" aria-label="删除卡片" data-archive-delete="${escapeHtml(archive.id)}">×</button>
      </span>
      <div class="archive-card-body">
        <strong>${escapeHtml(archive.nickname)}</strong>
        <p class="muted">${escapeHtml(formatArchiveSidebarSummary(archive))}</p>
      </div>
    </div>
  `;
}

function renderArchiveManagerCard(archive) {
  const isActive = archive.id === pendingArchiveId || archive.id === selectedArchive?.id;
  return `
    <article class="archive-card archive-card-manager ${isActive ? "is-active" : ""}" data-archive-id="${escapeHtml(archive.id)}">
      <button class="archive-card-main" type="button" data-archive-select="${escapeHtml(archive.id)}">
        <span class="archive-card-badge" aria-hidden="true">${escapeHtml(getArchiveBadgeLabel(archive.nickname))}</span>
        <div class="archive-card-body">
          <div class="archive-card-top">
            <strong>${escapeHtml(archive.nickname)}</strong>
            <span class="chip">${escapeHtml(archive.calendarType === "lunar" ? "农历" : "公历")}</span>
          </div>
          <p class="muted">${escapeHtml(formatArchiveSummary(archive))}</p>
          ${archive.note ? `<p class="archive-note-line">${escapeHtml(archive.note)}</p>` : ""}
        </div>
      </button>
      <div class="archive-card-actions">
        <button class="icon-btn" type="button" title="修改档案" aria-label="修改档案" data-archive-edit="${escapeHtml(archive.id)}">✎</button>
        <button class="icon-btn danger" type="button" title="删除档案" aria-label="删除档案" data-archive-delete="${escapeHtml(archive.id)}">×</button>
      </div>
    </article>
  `;
}

function formatArchiveSummary(archive) {
  const dateLabel = archive.calendarType === "lunar" ? `农历 ${archive.birthDate}` : `公历 ${archive.birthDate}`;
  const timeLabel = archive.birthTime ? ` · ${archive.birthTime}` : "";
  const placeLabel = archive.birthPlace ? ` · ${archive.birthPlace}` : "";
  return `${dateLabel}${timeLabel}${placeLabel}`;
}

function formatArchiveSidebarSummary(archive) {
  const dateText = formatArchiveDate(archive.birthDate, archive.calendarType === "lunar" ? "农历" : "公历");
  return dateText;
}

function formatArchiveDate(birthDate, prefix) {
  const raw = String(birthDate || "");
  const [year, month, day] = raw.split("-");
  if (!year || !month || !day) {
    return prefix ? `${prefix} ${raw}` : raw;
  }
  return `${prefix} ${year}年${Number(month)}月${Number(day)}日`;
}

function getArchiveBadgeLabel(name) {
  const label = String(name || "").trim();
  if (!label) return "档";
  return label.slice(0, 1);
}

function getArchiveFormPayload() {
  const nickname = document.querySelector("#archive-nickname").value.trim();
  const gender = document.querySelector("#archive-gender").value;
  const birthPlace = document.querySelector("#archive-birth-place").value.trim();
  const note = document.querySelector("#archive-note").value.trim();
  const calendarType = archiveCalendarType.value;

  if (!nickname) {
    throw new Error("请先填写称谓。");
  }

  if (!birthPlace) {
    throw new Error("请先填写诞生之地。");
  }

  if (calendarType === "solar") {
    const birthDate = document.querySelector("#archive-birth-date").value;
    const birthTime = document.querySelector("#archive-birth-time").value || "09:00";
    if (!birthDate) {
      throw new Error("请先填写公历生日。");
    }

    return {
      nickname,
      calendarType: "solar",
      birthDate,
      birthTime,
      gender,
      birthPlace,
      note
    };
  }

  const year = Number(archiveLunarYearInput.value);
  const month = Number(archiveLunarMonthSelect.value);
  const day = Number(archiveLunarDaySelect.value);
  const birthTime = archiveLunarHourSelect.value || "09:00";

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error("请先完整选择农历年月日。");
  }

  return {
    nickname,
    calendarType: "lunar",
    birthDate: `${year}-${month}-${String(day).padStart(2, "0")}`,
    birthTime,
    gender,
    birthPlace,
    note
  };
}

function setModalOpen(modal, open) {
  if (!modal) return;
  modal.hidden = !open;
}

function onOverlayClick(event) {
  if (event.target === archivePickerModal) {
    setModalOpen(archivePickerModal, false);
  }
  if (event.target === archiveCreateModal) {
    setModalOpen(archiveCreateModal, false);
  }
}

function onKeydownCloseModal(event) {
  if (event.key !== "Escape") return;
  setModalOpen(archivePickerModal, false);
  setModalOpen(archiveCreateModal, false);
}

function handleArchiveCalendarToggle() {
  const isLunar = archiveCalendarType.value === "lunar";
  archiveSolarFields.hidden = isLunar;
  archiveLunarFields.hidden = !isLunar;
  toggleFieldsetDisabled(archiveSolarFields, isLunar);
  toggleFieldsetDisabled(archiveLunarFields, !isLunar);

  if (isLunar) {
    loadArchiveLunarPicker().catch(() => {});
  }
}

async function loadArchiveLunarPicker() {
  if (archiveCalendarType.value !== "lunar") {
    return;
  }

  const year = Number(archiveLunarYearInput.value || new Date().getFullYear());
  const month = archiveLunarMonthSelect.value ? Number(archiveLunarMonthSelect.value) : undefined;
  const day = archiveLunarDaySelect.value ? Number(archiveLunarDaySelect.value) : undefined;

  const query = new URLSearchParams({ year: String(year) });
  if (Number.isFinite(month)) {
    query.set("month", String(month));
  }
  if (Number.isFinite(day)) {
    query.set("day", String(day));
  }

  const response = await fetch(`/api/v1/bazi/lunar-picker?${query.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    return;
  }

  archiveLunarMonthSelect.innerHTML = data.result.months
    .map((item) => `<option value="${item.value}" ${item.value === data.result.selected.month ? "selected" : ""}>${escapeHtml(item.label)}${item.isLeap ? "（闰）" : ""}${item.ganzhi ? ` · ${escapeHtml(item.ganzhi)}` : ""}</option>`)
    .join("");

  archiveLunarDaySelect.innerHTML = data.result.days
    .map((item) => `<option value="${item.value}" ${item.value === data.result.selected.day ? "selected" : ""}>${escapeHtml(item.label)}</option>`)
    .join("");

  archiveLunarHourSelect.innerHTML = data.result.hourOptions
    .map((item) => `<option value="${item.value}">${escapeHtml(item.label)} · ${escapeHtml(item.range)}</option>`)
    .join("");
}

function resetArchiveForm() {
  archiveCreateForm.reset();
  document.querySelector("#archive-nickname").value = "";
  document.querySelector("#archive-gender").value = "female";
  document.querySelector("#archive-birth-place").value = "";
  document.querySelector("#archive-note").value = "";
  archiveCalendarType.value = "solar";
  document.querySelector("#archive-birth-date").value = "";
  document.querySelector("#archive-birth-time").value = "09:00";
  archiveLunarYearInput.value = String(new Date().getFullYear());
  archiveLunarHourSelect.value = "09:00";
  archiveCreateMessage.textContent = "";
  handleArchiveCalendarToggle();
}

function renderArchiveHint() {
  if (!selectedArchiveName || !selectedArchiveDetail) return;

  if (!selectedArchive) {
    selectedArchiveName.textContent = "未选择";
    selectedArchiveDetail.textContent = "请选择一条档案后再生成命盘。";
    return;
  }

  selectedArchiveName.textContent = selectedArchive.nickname || "未命名档案";
  selectedArchiveDetail.textContent = formatArchiveSummary(selectedArchive);
}

function applyPendingHighlight() {
  const activeId = pendingArchiveId || selectedArchive?.id || "";
  document.querySelectorAll("[data-archive-id]").forEach((node) => {
    node.classList.toggle("is-active", Boolean(activeId) && node.getAttribute("data-archive-id") === activeId);
  });
}

function selectArchiveFromUi(input) {
  const archiveId =
    typeof input === "string"
      ? input
      : input?.dataset?.archiveId || input?.currentTarget?.dataset?.archiveId || input?.target?.closest?.("[data-archive-id]")?.getAttribute("data-archive-id");

  if (!archiveId) {
    return;
  }

  pendingArchiveId = archiveId;
  const archive = archives.find((item) => item.id === archiveId) || null;
  if (archive) {
    selectedArchive = archive;
    localStorage.setItem(LOCAL_SELECTED_ARCHIVE_KEY, archive.id);
  }

  renderArchiveList();
  renderArchiveHint();
}

function confirmArchiveSelection() {
  if (!pendingArchiveId && archives.length) {
    pendingArchiveId = archives[0].id;
  }
  const archive = archives.find((item) => item.id === pendingArchiveId) || null;
  if (archive) {
    selectedArchive = archive;
    localStorage.setItem(LOCAL_SELECTED_ARCHIVE_KEY, archive.id);
  }
  renderArchiveList();
  renderArchiveHint();
  setModalOpen(archivePickerModal, false);
}

async function generateFromSelectedArchive() {
  const archive = selectedArchive || archives.find((item) => item.id === pendingArchiveId) || archives[0];
  if (!archive) {
    archiveCreateMessage.textContent = "请先新增或选择一条档案。";
    return;
  }

  selectedArchive = archive;
  pendingArchiveId = archive.id;
  renderArchiveHint();
  localStorage.setItem(LOCAL_SELECTED_ARCHIVE_KEY, archive.id);

  const payload = {
    calendarType: archive.calendarType,
    birthDate: archive.birthDate,
    birthTime: archive.birthTime,
    gender: archive.gender,
    birthPlace: archive.birthPlace,
    focusYear: new Date().getFullYear(),
    isVip: getFlowInsightAccessMode() === "vip"
  };

  flowAiInsightCache = { dayun: {}, liunian: {}, liuyue: {} };
  flowReferenceAiCache = { dayun: {}, liunian: {}, liuyue: {} };
  flowAiInsightLoading = new Set();

  const response = await authFetch("/api/v1/bazi/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    archiveCreateMessage.textContent = data.message || "命盘生成失败。";
    return;
  }

  renderBaziResult(data.result);

  const aiResponse = await authFetch("/api/v1/bazi/ai-context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const aiData = await aiResponse.json();
  if (aiResponse.ok) {
    latestAiContext = aiData.aiContext;
    currentUser = await fetchCurrentUser();
  }
}

function getFlowInsightAccessMode() {
  if (FLOW_ACCESS_MODE_OVERRIDE === "normal" || FLOW_ACCESS_MODE_OVERRIDE === "vip" || FLOW_ACCESS_MODE_OVERRIDE === "free") {
    return FLOW_ACCESS_MODE_OVERRIDE;
  }
  return currentUser?.isVip ? "vip" : "normal";
}

function isFlowInsightVipAvailable() {
  return getFlowInsightAccessMode() !== "normal";
}

function getFlowInsightBadgeHtml() {
  const mode = getFlowInsightAccessMode();
  if (mode === "vip") {
    return '<span class="flow-vip-badge">VIP</span>';
  }
  if (mode === "free") {
    return '<span class="flow-vip-badge is-free">限时免费</span>';
  }
  return "";
}

function getFlowInsightItemKey(section, item) {
  if (!item) return "";
  if (section === "dayun") return `${section}:${item.startYear || ""}:${item.endYear || ""}:${item.ganzhi || ""}`;
  if (section === "liunian") return `${section}:${item.year || ""}:${item.ganzhi || ""}`;
  return `${section}:${item.solarTerm || item.monthChinese || ""}:${item.ganzhi || ""}`;
}

function getFlowInsightCacheEntry(section, item) {
  const key = getFlowInsightItemKey(section, item);
  return key ? flowAiInsightCache[section]?.[key] || null : null;
}

function getFlowInsightCachedMetrics(section, item) {
  const entry = getFlowInsightCacheEntry(section, item);
  return entry?.status === "success" ? entry.metrics || null : null;
}

async function generateFlowInsightAiForSection(section, options = {}) {
  const items = getFlowPanelItems(latestRenderedBaziResult, section);
  if (!items.length) return;
  const loadingKey = `section:${section}`;
  const currentItem = items[flowPanelState[section] ?? 0] || items[0];
  const accessMode = getFlowInsightAccessMode();
  const isVipOpen = accessMode !== "normal";
  const sourceItems = isVipOpen ? items : [currentItem];
  const payloadItems = sourceItems
    .map((item) => ({
      key: getFlowInsightItemKey(section, item),
      headline: buildFlowInsightHeadline(section, item),
      item
    }))
    .filter((entry) => entry.key && entry.item && typeof entry.item === "object");

  if (!payloadItems.length || flowAiInsightLoading.has(loadingKey)) {
    if (!payloadItems.length && currentItem) {
      const currentKey = getFlowInsightItemKey(section, currentItem);
      if (currentKey) {
        flowAiInsightCache[section][currentKey] = {
          status: "error",
          error: "当前阶段数据不完整，暂时无法生成分析。"
        };
        renderBaziResult(latestRenderedBaziResult, { preserveFlowPanelState: true });
      }
    }
    return;
  }

  if (!options.force) {
    const allGenerated = payloadItems.every((entry) => flowAiInsightCache[section]?.[entry.key]?.status === "success");
    if (allGenerated) {
      return;
    }
  }

  if (!latestAiContext) {
    payloadItems.forEach((entry) => {
      flowAiInsightCache[section][entry.key] = {
        status: "error",
        error: "AI 上下文尚未准备完成，请稍后重试。"
      };
    });
    renderBaziResult(latestRenderedBaziResult, { preserveFlowPanelState: true });
    return;
  }

  flowAiInsightLoading.add(loadingKey);
  payloadItems.forEach((entry) => {
    flowAiInsightCache[section][entry.key] = {
      status: "loading",
      error: "",
      metrics: null
    };
  });
  renderBaziResult(latestRenderedBaziResult, { preserveFlowPanelState: true });

  try {
    if (!isVipOpen) {
      const response = await authFetch("/api/v1/bazi/flow-insight-v2-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          headline: payloadItems[0].headline,
          item: payloadItems[0].item,
          aiContext: latestAiContext
        })
      });
      const data = await response.json();
      if (response.ok && data?.result?.metrics) {
        flowAiInsightCache[section][payloadItems[0].key] = {
          status: "success",
          error: "",
          metrics: data.result.metrics
        };
      } else {
        flowAiInsightCache[section][payloadItems[0].key] = {
          status: "error",
          error: data?.message || "分析失败，可能是 API 余额不足或服务暂时不可用。"
        };
      }
    } else {
      const response = await authFetch("/api/v1/bazi/flow-insight-batch-v2-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          items: payloadItems,
          aiContext: latestAiContext,
          accessMode
        })
      });
      const data = await response.json();

      if (response.ok && Array.isArray(data?.result?.items)) {
        const metricsMap = new Map(
          data.result.items
            .filter((entry) => entry?.key)
            .map((entry) => [entry.key, entry.metrics || null])
        );
        payloadItems.forEach((entry) => {
          const metrics = metricsMap.get(entry.key);
          if (metrics) {
            flowAiInsightCache[section][entry.key] = {
              status: "success",
              error: "",
              metrics
            };
          } else {
            flowAiInsightCache[section][entry.key] = {
              status: "error",
              error: "当前阶段分析未完整返回，请重新生成。"
            };
          }
        });
      } else {
        payloadItems.forEach((entry) => {
          flowAiInsightCache[section][entry.key] = {
            status: "error",
            error: data?.message || "分析失败，可能是 API 余额不足或服务暂时不可用。"
          };
        });
      }
    }
  } catch (error) {
    console.error("flow insight ai failed", error);
    payloadItems.forEach((entry) => {
      flowAiInsightCache[section][entry.key] = {
        status: "error",
        error: error instanceof Error ? error.message : "分析失败，可能是 API 余额不足或服务暂时不可用。"
      };
    });
  } finally {
    flowAiInsightLoading.delete(loadingKey);
    renderBaziResult(latestRenderedBaziResult, { preserveFlowPanelState: true });
  }
}

async function onOpenArchivePicker() {
  await loadArchives();
  setModalOpen(archivePickerModal, true);
}

function onOpenCreateArchive() {
  resetArchiveForm();
  editingArchiveId = null;
  archiveCreateTitle.textContent = "录入基础信息";
  archiveCreateSubmit.textContent = "保存档案";
  archiveCreateMessage.textContent = "保存后会回到档案列表，你可以继续选择，也可以直接关闭回到八字排盘页。";
  setModalOpen(archivePickerModal, false);
  setModalOpen(archiveCreateModal, true);
}

async function onCreateArchive(event) {
  event.preventDefault();

  let payload;
  try {
    payload = getArchiveFormPayload();
  } catch (error) {
    archiveCreateMessage.textContent = error instanceof Error ? error.message : "保存失败。";
    return;
  }

  const isEditing = Boolean(editingArchiveId);
  const localRecord = normalizeArchiveRecord({
    id: isEditing ? editingArchiveId : undefined,
    ...payload,
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const localMap = new Map(readLocalArchives().map((item) => [item.id, item]));
  localMap.set(localRecord.id, localRecord);
  const localList = [...localMap.values()];
  writeLocalArchives(localList);

  let remoteRecord = null;
  if (currentUser) {
    try {
      const response = await authFetch(
        isEditing ? `/api/v1/user-center/bazi-archives/${editingArchiveId}` : "/api/v1/user-center/bazi-archives",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (response.ok) {
        remoteRecord = normalizeArchiveRecord(data.archive);
        if (Array.isArray(data.archives)) {
          archives = data.archives.map(normalizeArchiveRecord).filter(Boolean);
          writeLocalArchives(archives);
        }
      } else {
        archiveCreateMessage.textContent = data.message || "保存档案失败。";
      }
    } catch (error) {
      archiveCreateMessage.textContent = error instanceof Error ? error.message : "保存档案失败。";
    }
  }

  if (remoteRecord) {
    archives = mergeArchives(localList, [remoteRecord]);
  } else {
    archives = localList;
  }

  selectedArchive = remoteRecord || localRecord;
  pendingArchiveId = selectedArchive.id;
  localStorage.setItem(LOCAL_SELECTED_ARCHIVE_KEY, selectedArchive.id);
  renderArchiveList();
  renderArchiveHint();
  editingArchiveId = null;
  archiveCreateTitle.textContent = "录入基础信息";
  archiveCreateSubmit.textContent = "保存档案";
  setModalOpen(archiveCreateModal, false);
}

function onEditArchive(input) {
  const archiveId =
    typeof input === "string"
      ? input
      : input?.dataset?.archiveId || input?.currentTarget?.dataset?.archiveId || input?.target?.closest?.("[data-archive-edit]")?.getAttribute("data-archive-edit");
  if (!archiveId) return;

  const archive = archives.find((item) => item.id === archiveId);
  if (!archive) return;

  editingArchiveId = archiveId;
  document.querySelector("#archive-nickname").value = archive.nickname || "";
  document.querySelector("#archive-gender").value = archive.gender || "female";
  document.querySelector("#archive-birth-place").value = archive.birthPlace || "";
  document.querySelector("#archive-note").value = archive.note || "";
  archiveCalendarType.value = archive.calendarType || "solar";
  handleArchiveCalendarToggle();

  if (archive.calendarType === "solar") {
    document.querySelector("#archive-birth-date").value = archive.birthDate || "";
    document.querySelector("#archive-birth-time").value = archive.birthTime || "09:00";
  } else {
    const [year, month, day] = String(archive.birthDate || "").split("-");
    archiveLunarYearInput.value = year || String(new Date().getFullYear());
    loadArchiveLunarPicker().then(() => {
      if (month) archiveLunarMonthSelect.value = String(Number(month));
      if (day) archiveLunarDaySelect.value = String(Number(day));
      archiveLunarHourSelect.value = archive.birthTime || "09:00";
    });
  }

  archiveCreateTitle.textContent = "修改档案";
  archiveCreateSubmit.textContent = "保存修改";
  archiveCreateMessage.textContent = "修改后会覆盖当前档案内容。";
  setModalOpen(archivePickerModal, false);
  setModalOpen(archiveCreateModal, true);
}

async function onDeleteArchive(input) {
  const archiveId =
    typeof input === "string"
      ? input
      : input?.dataset?.archiveId || input?.currentTarget?.dataset?.archiveId || input?.target?.closest?.("[data-archive-delete]")?.getAttribute("data-archive-delete");
  if (!archiveId) return;

  if (currentUser) {
    try {
      await authFetch(`/api/v1/user-center/bazi-archives/${archiveId}`, {
        method: "DELETE"
      });
    } catch (error) {
      // keep local delete best-effort
    }
  }

  archives = readLocalArchives().filter((item) => item.id !== archiveId);
  writeLocalArchives(archives);

  if (selectedArchive?.id === archiveId) {
    selectedArchive = archives[0] || null;
    pendingArchiveId = selectedArchive?.id || "";
    if (selectedArchive) {
      localStorage.setItem(LOCAL_SELECTED_ARCHIVE_KEY, selectedArchive.id);
    } else {
      localStorage.removeItem(LOCAL_SELECTED_ARCHIVE_KEY);
    }
  } else if (pendingArchiveId === archiveId) {
    pendingArchiveId = selectedArchive?.id || archives[0]?.id || "";
  }

  renderArchiveList();
  renderArchiveHint();
}

function restoreSelectedArchive() {
  const selectedId = localStorage.getItem(LOCAL_SELECTED_ARCHIVE_KEY);
  selectedArchive = archives.find((item) => item.id === selectedId) || archives[0] || null;
  pendingArchiveId = selectedArchive?.id || pendingArchiveId || "";
  if (selectedArchive) {
    localStorage.setItem(LOCAL_SELECTED_ARCHIVE_KEY, selectedArchive.id);
  }
  renderArchiveHint();
}

window.__baziSelectArchive = selectArchiveFromUi;
window.__baziEditArchive = onEditArchive;
window.__baziDeleteArchive = onDeleteArchive;


function renderBaziResult(result, options = {}) {
  const { preserveFlowPanelState = false, animateModules = !preserveFlowPanelState } = options;
  latestRenderedBaziResult = result;
  const shenshaMap = buildPillarShenshaMap(result.shenShaAnalysis?.items || []);
  const currentDaYun = result.flowAnalysis?.supported ? result.flowAnalysis.currentDaYun : null;
  const currentLiuNian = result.flowAnalysis?.supported ? result.flowAnalysis.currentLiuNian : null;
  const currentLiuYue = pickCurrentMonth(result.flowAnalysis?.supported ? result.flowAnalysis.liuYue : []);
  const dayMasterStem = result.dayMaster?.value || result.pillars?.[2]?.heavenlyStem?.value || "";
  const boardColumns = [
    buildBoardColumn("年柱", result.pillars[0], shenshaMap.year, dayMasterStem),
    buildBoardColumn("月柱", result.pillars[1], shenshaMap.month, dayMasterStem),
    buildBoardColumn("日柱", result.pillars[2], shenshaMap.day, dayMasterStem),
    buildBoardColumn("时柱", result.pillars[3], shenshaMap.hour, dayMasterStem)
  ];
  boardColumns.push(
    buildFlowColumn("大运", currentDaYun, dayMasterStem),
    buildFlowYearColumn("流年", currentLiuNian, dayMasterStem),
    buildFlowMonthColumn("流月", currentLiuYue, dayMasterStem)
  );
  const boardRows = [
    { label: "主星", values: boardColumns.map((item) => item.mainStar) },
    { label: "天干", values: boardColumns.map((item) => item.stem), rowClass: "is-ganzhi-row" },
    { label: "地支", values: boardColumns.map((item) => item.branch), rowClass: "is-ganzhi-row" },
    { label: "藏干", values: boardColumns.map((item) => item.hidden) },
    { label: "星运", values: boardColumns.map((item) => item.starLuck) },
    { label: "副星", values: boardColumns.map((item) => item.subStar) },
    { label: "纳音", values: boardColumns.map((item) => item.nayin) },
    { label: "空亡", values: boardColumns.map((item) => item.xunkong) },
    { label: "地势", values: boardColumns.map((item) => item.dishi) },
    { label: "自坐", values: boardColumns.map((item) => item.selfSeat) },
    { label: "神煞（常用）", values: boardColumns.map((item) => item.shenshaCommon), rowClass: "is-shensha-row" },
    { label: "神煞（不常用）", values: boardColumns.map((item) => item.shenshaUncommon), rowClass: "is-shensha-row" }
  ];

  const wuxingStats = result.wuXingStats || [];
  const maxWuxing = Math.max(...wuxingStats.map((item) => item.count), 1);
  if (!preserveFlowPanelState) {
    flowPanelState = getInitialFlowPanelState(result, currentDaYun, currentLiuNian, currentLiuYue);
  }
  const premiumCards = Object.values(result.premiumAnalysis.sections || {})
    .map(
      (section) => `
        <article class="vip-card">
          <div class="section-title">
            <h4>${section.title}</h4>
            <span class="chip">限时免费</span>
          </div>
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
  const quickSummaryCards = `
    <div class="board-quick-grid">
      <div class="result-card">
        <p class="card-label">生肖</p>
        <div class="display-value">${result.calendar.zodiac}</div>
      </div>
      <div class="result-card">
        <p class="card-label">节气</p>
        <div class="display-value">${result.calendar.jieQi || "平节气日"}</div>
      </div>
      <div class="result-card">
        <p class="card-label">命宫</p>
        <div class="display-value">${result.chartMeta.mingGong.value}</div>
      </div>
      <div class="result-card">
        <p class="card-label">身宫</p>
        <div class="display-value">${result.chartMeta.shenGong.value}</div>
      </div>
    </div>
  `;

  resultContainer.innerHTML = `
    <section class="bazi-board-shell">
      <div class="bazi-board-top">
        <div class="bazi-board-title">
          <p class="card-label">青筮命帖 · ${escapeHtml(selectedArchive?.nickname || "当前档案")}</p>
          <h2>${result.calendar.solar} ${selectedArchive?.birthTime || ""}</h2>
          <p class="muted">${result.calendar.lunar} · ${result.dayMaster.label} · ${result.strengthAnalysis.levelLabel}</p>
        </div>
        ${quickSummaryCards}
      </div>

      <section class="section-block bazi-detail-block">
        <div class="bazi-workbench-grid">
          <article class="bazi-workbench-pane bazi-workbench-pane-detail">
            <div class="section-title bazi-workbench-head">
              <div>
                <h3>排盘明细</h3>
                <p class="muted">四柱顺序保持 年 / 月 / 日 / 时，版式压缩后继续保留藏干、副星、纳音、空亡、地势、自坐与神煞。</p>
                ${renderShenshaLegendMini()}
              </div>
            </div>
            <div class="table-wrap bazi-dark-table-wrap bazi-compact-table-wrap">
              <table class="bazi-dark-table bazi-pillar-table bazi-pillar-table-compact">
                <thead>
                  <tr>
                    <th>排盘明细</th>
                    ${boardColumns.map((item) => `<th>${item.label}</th>`).join("")}
                  </tr>
                </thead>
                <tbody>
                  ${boardRows
                    .map(
                      (row) => `
                        <tr class="${row.rowClass || ""}">
                          <td class="row-head">${row.label}</td>
                          ${row.values.map((value) => `<td>${value}</td>`).join("")}
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </article>

          <aside class="bazi-workbench-pane bazi-workbench-pane-flow">
            ${renderFlowReferencePanel(result, currentDaYun, currentLiuNian, currentLiuYue, dayMasterStem)}
          </aside>
        </div>
      </section>

      <section class="section-block">
        ${renderWuXingFlowDashboard(result, wuxingStats, maxWuxing)}
      </section>

      <section class="section-block">
        <div class="section-title">
          <h3>整盘四维推荐日柱</h3>
          <span class="chip">四向匹配</span>
        </div>
        ${renderMatchingDayMasterPanel(result)}
      </section>

      <section class="section-block">
        <div class="section-title">
          <h3>专项解读</h3>
          <span class="chip">当前限时免费开放</span>
        </div>
        <div class="card-grid">${premiumCards}</div>
      </section>
    </section>
  `;

  queueBorderGlowRefresh({ animateModules, scope: "result" });
}

function renderHiddenStem(item, dayMasterStem) {
  const tenGod = getTenGod(dayMasterStem, item.value);
  return `<span class="hidden-pill"><span class="pillar-inline-text" style="color:${item.colorHex}">${item.value}${item.wuxing}（${tenGod}）</span></span>`;
}

function buildBoardColumn(label, pillar, shensha, dayMasterStem) {
  const hiddenStems = (pillar.hiddenStems || []).map((item) => renderHiddenStem(item, dayMasterStem)).join("<br>");
  const subStars = [pillar.shiShenStem, ...(pillar.shiShenBranch || [])].filter((item) => item && item !== "日主");
  return {
    label,
    mainStar: `<span class="pillar-inline-text">${pillar.shiShenStem === "日主" ? "—" : (pillar.shiShenStem || "—")}</span>`,
    stem: largeGanzhiCell(pillar.heavenlyStem.value, pillar.heavenlyStem.colorHex),
    branch: largeGanzhiCell(pillar.earthlyBranch.value, pillar.earthlyBranch.colorHex),
    hidden: hiddenStems || "—",
    starLuck: `<span class="pillar-inline-text">${pillar.diShi || "—"}</span>`,
    subStar:
      subStars.map((item) => `<span class="pillar-inline-text">${item}</span>`).join("<br>") || "—",
    nayin: `<span class="pillar-inline-text">${pillar.naYin || "—"}</span>`,
    dishi: `<span class="pillar-inline-text">${pillar.diShi || "—"}</span>`,
    selfSeat: `<span class="pillar-inline-text">${pillar.diShi || "—"}</span>`,
    xunkong: `<span class="pillar-inline-text">${pillar.xunKong || "—"}</span>`,
    shenshaCommon: renderShenshaTags(shensha?.common || []),
    shenshaUncommon: renderShenshaTags(shensha?.uncommon || [])
  };
}

function buildFlowColumn(label, item, dayMasterStem) {
  if (!item) return emptyFlowColumn(label);
  const detail = buildFlowDetail(item.ganzhi, dayMasterStem);
  return {
    label,
    mainStar: `<span class="pillar-inline-text">${detail.mainStar}</span>`,
    stem: largeGanzhiCell(detail.stem.value, detail.stem.colorHex),
    branch: largeGanzhiCell(detail.branch.value, detail.branch.colorHex),
    hidden: detail.hidden,
    starLuck: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    subStar: detail.subStar,
    nayin: `<span class="pillar-inline-text">${detail.nayin}</span>`,
    dishi: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    selfSeat: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    xunkong: `<span class="pillar-inline-text">${item.xunKong || "—"}</span>`,
    shenshaCommon: renderShenshaTags(item.shenShaAnalysis?.commonItems || []),
    shenshaUncommon: renderShenshaTags(item.shenShaAnalysis?.uncommonItems || [])
  };
}

function buildFlowYearColumn(label, item, dayMasterStem) {
  if (!item) return emptyFlowColumn(label);
  const detail = buildFlowDetail(item.ganzhi, dayMasterStem);
  return {
    label,
    mainStar: `<span class="pillar-inline-text">${detail.mainStar}</span>`,
    stem: largeGanzhiCell(detail.stem.value, detail.stem.colorHex),
    branch: largeGanzhiCell(detail.branch.value, detail.branch.colorHex),
    hidden: detail.hidden,
    starLuck: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    subStar: detail.subStar,
    nayin: `<span class="pillar-inline-text">${detail.nayin}</span>`,
    dishi: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    selfSeat: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    xunkong: `<span class="pillar-inline-text">${item.xunKong || "—"}</span>`,
    shenshaCommon: renderShenshaTags(item.shenShaAnalysis?.commonItems || []),
    shenshaUncommon: renderShenshaTags(item.shenShaAnalysis?.uncommonItems || [])
  };
}

function buildFlowMonthColumn(label, item, dayMasterStem) {
  if (!item) return emptyFlowColumn(label);
  const detail = buildFlowDetail(item.ganzhi, dayMasterStem);
  return {
    label,
    mainStar: `<span class="pillar-inline-text">${detail.mainStar}</span>`,
    stem: largeGanzhiCell(detail.stem.value, detail.stem.colorHex),
    branch: largeGanzhiCell(detail.branch.value, detail.branch.colorHex),
    hidden: detail.hidden,
    starLuck: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    subStar: detail.subStar,
    nayin: `<span class="pillar-inline-text">${detail.nayin}</span>`,
    dishi: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    selfSeat: `<span class="pillar-inline-text">${detail.starLuck}</span>`,
    xunkong: `<span class="pillar-inline-text">${item.xunKong || "—"}</span>`,
    shenshaCommon: renderShenshaTags(item.shenShaAnalysis?.commonItems || []),
    shenshaUncommon: renderShenshaTags(item.shenShaAnalysis?.uncommonItems || [])
  };
}

function emptyFlowColumn(label) {
  return {
    label,
    mainStar: "—",
    stem: "—",
    branch: "—",
    hidden: "—",
    starLuck: "—",
    subStar: "—",
    nayin: "—",
    dishi: "—",
    selfSeat: "—",
    xunkong: "—",
    shenshaCommon: "—",
    shenshaUncommon: "—"
  };
}

function buildFlowDetail(ganzhi, dayMasterStem) {
  const stem = getStemDetail(ganzhi?.[0]);
  const branchValue = ganzhi?.[1] || "";
  const branchMeta = BRANCH_META[branchValue] || { colorHex: "#d8b66d", wuxing: "" };
  const hiddenStems = (BRANCH_HIDDEN_STEMS[branchValue] || []).map((item) => getStemDetail(item));

  return {
    stem,
    branch: {
      value: branchValue || "—",
      colorHex: branchMeta.colorHex
    },
    mainStar: getTenGod(dayMasterStem, ganzhi?.[0]) || "—",
    hidden: hiddenStems
      .map((item) => renderHiddenStem(item, dayMasterStem))
      .join("<br>") || "—",
    starLuck: getChangShengStage(dayMasterStem, branchValue) || "—",
    subStar:
      hiddenStems
        .map((item) => `<span class="pillar-inline-text">${getTenGod(dayMasterStem, item.value)}</span>`)
        .join("<br>") || "—",
    nayin: NAYIN_MAP[ganzhi] || "—"
  };
}

function getStemDetail(stem) {
  const meta = STEM_META[stem];
  if (!meta) {
    return { value: stem || "—", colorHex: "#d8b66d", wuxing: "" };
  }
  return { value: stem, colorHex: meta.colorHex, wuxing: meta.wuxing };
}

function getElementRelation(dayElement, targetElement) {
  if (!dayElement || !targetElement) return "unknown";
  if (dayElement === targetElement) return "same";

  const generating = {
    木: "火",
    火: "土",
    土: "金",
    金: "水",
    水: "木"
  };
  const overcoming = {
    木: "土",
    火: "金",
    土: "水",
    金: "木",
    水: "火"
  };

  if (generating[dayElement] === targetElement) return "output";
  if (overcoming[dayElement] === targetElement) return "wealth";
  if (overcoming[targetElement] === dayElement) return "power";
  return "resource";
}

function getTenGod(dayMasterStem, targetStem) {
  const dayMeta = STEM_META[dayMasterStem];
  const targetMeta = STEM_META[targetStem];
  if (!dayMeta || !targetMeta) return "—";

  const samePolarity = dayMeta.yang === targetMeta.yang;
  const relation = getElementRelation(dayMeta.wuxing, targetMeta.wuxing);

  if (relation === "same") return samePolarity ? "比肩" : "劫财";
  if (relation === "resource") return samePolarity ? "偏印" : "正印";
  if (relation === "output") return samePolarity ? "食神" : "伤官";
  if (relation === "wealth") return samePolarity ? "偏财" : "正财";
  if (relation === "power") return samePolarity ? "七杀" : "正官";
  return "—";
}

function getChangShengStage(dayMasterStem, branch) {
  const offset = CHANG_SHENG_OFFSET[dayMasterStem];
  const dayMeta = STEM_META[dayMasterStem];
  const branchIndex = BRANCH_ORDER.indexOf(branch);
  if (offset === undefined || !dayMeta || branchIndex < 0) {
    return "—";
  }

  const index = dayMeta.yang
    ? (offset + branchIndex) % 12
    : (offset - branchIndex + 12 * 10) % 12;

  return CHANG_SHENG_ORDER[index] || "—";
}

function buildPillarShenshaMap(items) {
  const createBucket = () => ({ common: [], uncommon: [] });
  const map = { year: createBucket(), month: createBucket(), day: createBucket(), hour: createBucket() };
  for (const item of items) {
    for (const pillar of item.matchedPillars || []) {
      const enriched = { ...item, tone: item.tone || getShenshaTone(item) };
      const bucket = enriched.volume === "uncommon" ? "uncommon" : "common";
      if (pillar === "年柱") map.year[bucket].push(enriched);
      if (pillar === "月柱") map.month[bucket].push(enriched);
      if (pillar === "日柱") map.day[bucket].push(enriched);
      if (pillar === "时柱") map.hour[bucket].push(enriched);
    }
  }
  return map;
}

function renderShenshaTags(items) {
  if (!items?.length) {
    return '<span class="pillar-inline-text">—</span>';
  }
  const toneOrder = { "吉": 0, "中": 1, "凶": 2 };
  const sortedItems = [...items].sort((a, b) => {
    const toneDiff = (toneOrder[a.tone] ?? 9) - (toneOrder[b.tone] ?? 9);
    if (toneDiff !== 0) return toneDiff;
    return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
  });

  return `
    <div class="shensha-tag-list">
      ${sortedItems
        .map(
          (item) => `
            <span class="shensha-tag ${getShenshaToneClass(item.tone)}" title="${escapeHtml(`${item.name}：${item.meaning || ""} ${item.advice || ""}`)}">
              <span class="shensha-tag-label">${escapeHtml(item.name)}</span>
              <span class="shensha-tooltip" role="tooltip">
                <strong>${escapeHtml(item.name)}</strong>
                <em>${escapeHtml(item.tone || "中")} · ${escapeHtml(item.volume === "uncommon" ? "不常用" : "常用")}</em>
                <span>${escapeHtml(item.meaning || "暂无释义")}</span>
                <span>${escapeHtml(item.advice || "暂无提示")}</span>
              </span>
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function renderFlowCompareTable(items, dayMasterStem, type) {
  if (!items?.length || !items[0]) {
    return '<div class="flow-compare-empty">—</div>';
  }
  const item = items[0];
  const detail = buildFlowDetail(item.ganzhi, dayMasterStem);
  return `
    <table class="flow-mini-table">
      <tbody>
        <tr><th>天干</th><td>${largeGanzhiCell(detail.stem.value, detail.stem.colorHex)}</td></tr>
        <tr><th>地支</th><td>${largeGanzhiCell(detail.branch.value, detail.branch.colorHex)}</td></tr>
        <tr><th>藏干</th><td>${detail.hidden}</td></tr>
        <tr><th>副星</th><td>${detail.subStar}</td></tr>
        <tr><th>纳音</th><td>${detail.nayin}</td></tr>
        <tr><th>空亡</th><td>${item.xunKong || "—"}</td></tr>
        <tr><th>神煞</th><td>${renderShenshaTags(item.shenShaAnalysis?.commonItems || [])}</td></tr>
      </tbody>
    </table>
  `;
}

function getFlowPanelItems(result, section) {
  if (section === "dayun") {
    return ((result.daYun?.supported ? result.daYun.daYun : []) || []).slice(0, 10);
  }
  if (section === "liunian") {
    const liuNianItems = (result.flowAnalysis?.liuNianTimeline || []) || [];
    const currentLiuNian = result.flowAnalysis?.supported ? result.flowAnalysis.currentLiuNian : null;
    return getFlowWindow(
      liuNianItems,
      liuNianItems.findIndex((item) => item?.year === currentLiuNian?.year),
      10
    );
  }
  if (section === "liuyue") return ((result.flowAnalysis?.liuYue || []) || []).slice(0, 12);
  return [];
}

function getInitialFlowPanelState(result, currentDaYun, currentLiuNian, currentLiuYue) {
  const dayunItems = getFlowPanelItems(result, "dayun");
  const liunianItems = getFlowPanelItems(result, "liunian");
  const liuyueItems = getFlowPanelItems(result, "liuyue");
  return {
    dayun: Math.max(0, dayunItems.findIndex((item) => item?.ganzhi === currentDaYun?.ganzhi && item?.startYear === currentDaYun?.startYear)),
    liunian: Math.max(0, liunianItems.findIndex((item) => item?.year === currentLiuNian?.year)),
    liuyue: Math.max(0, liuyueItems.findIndex((item) => item?.ganzhi === currentLiuYue?.ganzhi && item?.monthChinese === currentLiuYue?.monthChinese))
  };
}

function renderWuXingFlowDashboard(result, wuxingStats, maxWuxing) {
  const dayunItems = getFlowPanelItems(result, "dayun");
  const liunianItems = getFlowPanelItems(result, "liunian");
  const liuyueItems = getFlowPanelItems(result, "liuyue");
  const currentDayun = dayunItems[flowPanelState.dayun] || dayunItems[0] || null;
  const currentLiunian = liunianItems[flowPanelState.liunian] || liunianItems[0] || null;
  const currentLiuyue = liuyueItems[flowPanelState.liuyue] || liuyueItems[0] || null;

  return `
    <div class="section-title wuxing-flow-title">
      <h3>五行统计与分析</h3>
    </div>
    <div class="wuxing-flow-layout">
      <div class="wuxing-analysis-column">
        ${renderWuXingStatsCard(wuxingStats, maxWuxing)}
        ${renderStrengthAnalysisCard(result)}
      </div>
      <div class="flow-insight-column">
        ${renderFlowInsightPanel("大运分析", "dayun", dayunItems, currentDayun, result)}
        ${renderFlowInsightPanel("流年分析", "liunian", liunianItems, currentLiunian, result)}
        ${renderFlowInsightPanel("流月分析", "liuyue", liuyueItems, currentLiuyue, result)}
      </div>
    </div>
  `;
}

function renderWuXingStatsCard(wuxingStats, maxWuxing) {
  const stats = normalizeWuXingStats(wuxingStats, maxWuxing);
  const radar = renderWuXingRadar(stats);
  return `
    <article class="wuxing-stats-card">
      <div class="section-title">
        <p class="section-kicker">五行五维统计</p>
      </div>
      <div class="wuxing-stats-grid">
        <div class="wuxing-radar-wrap">${radar}</div>
        <div class="wuxing-score-list">
          ${stats
            .map(
              (item) => `
                <div class="wuxing-score-row">
                  <div class="wuxing-score-label">
                    <span class="element-swatch" style="background:${item.colorHex}"></span>
                    <span>${item.name}</span>
                  </div>
                  <div class="wuxing-score-bar">
                    <div class="wuxing-score-fill" style="width:${item.score}%; background:${item.colorHex};"></div>
                  </div>
                  <strong>${item.score}</strong>
                  <span class="wuxing-score-state ${item.score >= 72 ? "is-strong" : item.score <= 45 ? "is-weak" : "is-mid"}">${item.score >= 72 ? "强" : item.score <= 45 ? "弱" : "平"}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </article>
  `;
}

function renderStrengthAnalysisCard(result) {
  const strength = result.strengthAnalysis || {};
  const favorable = (strength.favorableElements || []).map((item) => item.name).filter(Boolean);
  const unfavorable = (strength.unfavorableElements || []).map((item) => item.name).filter(Boolean);
  const levelText =
    strength.level === "strong" ? "身强" : strength.level === "weak" ? "身弱" : "中和";
  const dayMaster = result.dayMaster?.wuxing || result.dayMaster?.label || "日主";
  const favoredText = favorable.length ? favorable.join("、") : "待细分";
  const unfavoredText = unfavorable.length ? unfavorable.join("、") : "待细分";

  return `
    <article class="wuxing-strength-card ${strength.level === "strong" ? "is-strong-state" : strength.level === "weak" ? "is-weak-state" : "is-balanced-state"}">
      <div class="section-title">
        <p class="section-kicker">五行综合分析</p>
      </div>
      <div class="wuxing-strength-head">
        <div class="wuxing-strength-badge ${strength.level === "strong" ? "is-strong" : strength.level === "weak" ? "is-weak" : "is-balanced"}">${levelText}</div>
        <div class="wuxing-strength-copy">
          <p>日主主气为 <strong>${escapeHtml(dayMaster)}</strong>，当前命局判断为 <strong>${escapeHtml(strength.levelLabel || levelText)}</strong>。</p>
          <p>综合喜用偏向：<span class="is-good-text">${escapeHtml(favoredText)}</span>；需避重压与失衡：<span class="is-bad-text">${escapeHtml(unfavoredText)}</span>。</p>
        </div>
      </div>
      <div class="wuxing-god-grid">
        <div class="wuxing-god-box">
          <h4>喜用神</h4>
          <div class="wuxing-god-tags">${favorable.map((item) => `<span class="wuxing-god-tag is-good">${escapeHtml(item)}</span>`).join("") || "<span class=\"wuxing-god-tag\">待定</span>"}</div>
        </div>
        <div class="wuxing-god-box">
          <h4>忌神</h4>
          <div class="wuxing-god-tags">${unfavorable.map((item) => `<span class="wuxing-god-tag is-bad">${escapeHtml(item)}</span>`).join("") || "<span class=\"wuxing-god-tag\">待定</span>"}</div>
        </div>
      </div>
      <div class="wuxing-strength-tip">建议：${escapeHtml(buildStrengthAdvice(strength.level, favorable, unfavorable))}</div>
    </article>
  `;
}

function normalizeWuXingStats(wuxingStats, maxWuxing) {
  const order = ["木", "火", "土", "金", "水"];
  const statsMap = new Map((wuxingStats || []).map((item) => [item.name, item]));
  return order.map((name) => {
    const item = statsMap.get(name) || { name, count: 0, colorHex: "#b89b63" };
    const score = maxWuxing > 0 ? Math.round((Number(item.count || 0) / maxWuxing) * 100) : 0;
    return { ...item, score };
  });
}

function renderWuXingRadar(stats) {
  const cx = 150;
  const cy = 150;
  const radius = 92;
  const levels = 5;
  const points = stats.map((item, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / stats.length;
    const valueRadius = (radius * Math.max(0.16, item.score / 100));
    return {
      labelX: cx + Math.cos(angle) * (radius + 24),
      labelY: cy + Math.sin(angle) * (radius + 24),
      x: cx + Math.cos(angle) * valueRadius,
      y: cy + Math.sin(angle) * valueRadius,
      axisX: cx + Math.cos(angle) * radius,
      axisY: cy + Math.sin(angle) * radius,
      ...item
    };
  });
  const polygon = points.map((item) => `${item.x},${item.y}`).join(" ");
  const rings = Array.from({ length: levels }, (_, idx) => {
    const ringRadius = (radius / levels) * (idx + 1);
    const ringPoints = points.map((point, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / points.length;
      return `${cx + Math.cos(angle) * ringRadius},${cy + Math.sin(angle) * ringRadius}`;
    });
    return `<polygon points="${ringPoints.join(" ")}" class="wuxing-radar-ring" />`;
  }).join("");

  return `
    <svg viewBox="0 0 300 300" class="wuxing-radar-chart" aria-hidden="true">
      ${rings}
      ${points.map((item) => `<line x1="${cx}" y1="${cy}" x2="${item.axisX}" y2="${item.axisY}" class="wuxing-radar-axis" />`).join("")}
      <polygon points="${polygon}" class="wuxing-radar-shape" />
      ${points.map((item) => `<circle cx="${item.x}" cy="${item.y}" r="3.8" fill="${item.colorHex}" />`).join("")}
      ${points
        .map(
          (item) => `
            <text x="${item.labelX}" y="${item.labelY - 6}" class="wuxing-radar-label">${escapeHtml(item.name)}</text>
            <text x="${item.labelX}" y="${item.labelY + 14}" class="wuxing-radar-value">${item.score}</text>
          `
        )
        .join("")}
    </svg>
  `;
}

function buildStrengthAdvice(level, favorable, unfavorable) {
  const favored = favorable.length ? favorable.join("、") : "喜用五行";
  const unfavored = unfavorable.length ? unfavorable.join("、") : "失衡五行";
  if (level === "strong") {
    return `命局偏旺，宜顺着 ${favored} 去做释放与疏导，同时避免 ${unfavored} 继续叠加。`;
  }
  if (level === "weak") {
    return `命局偏弱，宜先补 ${favored} 的根气与环境支持，再承接财官压力，少让 ${unfavored} 过重。`;
  }
  return `命局偏平，关键在于顺势取用 ${favored}，并控制 ${unfavored} 过度波动。`;
}

function renderMatchingDayMasterPanel(result) {
  const categories = [
    { key: "emotion", title: "情感" },
    { key: "career", title: "共事" },
    { key: "wealth", title: "旺财" },
    { key: "comfort", title: "舒适旺运" }
  ];

  return `
    <div class="matching-daymaster-wrap">
      <div class="matching-daymaster-grid">
        ${categories
          .map((category) => {
            const items = getMatchingDayPillars(result, category.key).slice(0, 4);
            return `
              <article class="matching-daymaster-card">
                <div class="matching-daymaster-head">
                  <h4>${category.title}</h4>
                  <span class="matching-daymaster-sub">由旺到次旺</span>
                </div>
                <div class="matching-daymaster-list">
                  ${items
                    .map(
                      (item, index) => `
                        <div class="matching-daymaster-item">
                          <div class="matching-daymaster-rank">${index + 1}</div>
                          <div class="matching-daymaster-pillar">
                            <span class="matching-daymaster-stem" style="color:${item.stem.colorHex}">${item.stem.value}</span>
                            <span class="matching-daymaster-branch" style="color:${item.branch.colorHex}">${item.branch.value}</span>
                          </div>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
      <p class="matching-daymaster-note">仅供日柱参考具体要看整个八字的合盘来定。</p>
    </div>
  `;
}

function getMatchingDayPillars(result, category) {
  const nativeProfile = buildNativeChartProfile(result);
  const nativeDayStem = nativeProfile.dayStem;
  const favorable = new Set((result.strengthAnalysis?.favorableElements || []).map((item) => item.name).filter(Boolean));
  const unfavorable = new Set((result.strengthAnalysis?.unfavorableElements || []).map((item) => item.name).filter(Boolean));
  const cycle = Object.keys(NAYIN_MAP);

  return cycle
    .filter((ganzhi) => ganzhi && ganzhi !== `${nativeProfile.dayStem}${nativeProfile.dayBranch}`)
    .map((ganzhi) => {
      const stem = getStemDetail(ganzhi[0]);
      const branchValue = ganzhi[1];
      const branchMeta = BRANCH_META[branchValue] || { colorHex: "#d8b66d", wuxing: "" };
      const hiddenProfile = buildHiddenStemProfile(nativeDayStem, branchValue);
      return {
        ganzhi,
        stem,
        branch: {
          value: branchValue,
          colorHex: branchMeta.colorHex,
          wuxing: branchMeta.wuxing
        },
        score: scoreMatchingDayPillar({
          category,
          nativeProfile,
          stem,
          branch: { value: branchValue, wuxing: branchMeta.wuxing },
          hiddenProfile,
          favorable,
          unfavorable
        })
      };
    })
    .sort((a, b) => b.score - a.score || a.ganzhi.localeCompare(b.ganzhi, "zh-CN"));
}

function scoreMatchingDayPillar({
  category,
  nativeProfile,
  stem,
  branch,
  hiddenProfile,
  favorable,
  unfavorable
}) {
  const stemElement = stem.wuxing;
  const branchElement = branch.wuxing;
  const tenGod = getTenGod(nativeProfile.dayStem, stem.value);
  const branchAffinity = getAggregateBranchAffinity(nativeProfile, branch.value);
  const common = {
    nativeProfile,
    stem,
    branch,
    hiddenProfile,
    stemElement,
    branchElement,
    tenGod,
    branchAffinity,
    favorable,
    unfavorable
  };

  if (category === "emotion") return scoreEmotionMatch(common);
  if (category === "career") return scoreCareerMatch(common);
  if (category === "wealth") return scoreWealthMatch(common);
  return scoreComfortMatch(common);
}

function buildNativeChartProfile(result) {
  const pillars = result.pillars || [];
  const dayStem = result.dayMaster?.value || pillars[2]?.heavenlyStem?.value || "";
  const dayBranch = pillars[2]?.earthlyBranch?.value || "";
  const pillarWeights = [0.9, 1.6, 1.8, 1.1];

  return {
    dayStem,
    dayBranch,
    branches: pillars.map((pillar, index) => ({
      value: pillar?.earthlyBranch?.value || "",
      wuxing: pillar?.earthlyBranch?.wuxing || "",
      weight: pillarWeights[index] ?? 1
    })),
    stems: pillars.map((pillar, index) => ({
      value: pillar?.heavenlyStem?.value || "",
      wuxing: pillar?.heavenlyStem?.wuxing || "",
      tenGod: getTenGod(dayStem, pillar?.heavenlyStem?.value || ""),
      weight: pillarWeights[index] ?? 1
    })),
    hidden: pillars.flatMap((pillar, index) =>
      (pillar?.hiddenStems || []).map((item, hiddenIndex) => ({
        value: item.value,
        wuxing: item.wuxing,
        tenGod: getTenGod(dayStem, item.value),
        weight: (pillarWeights[index] ?? 1) * (hiddenIndex === 0 ? 0.85 : hiddenIndex === 1 ? 0.58 : 0.36)
      }))
    )
  };
}

function getAggregateBranchAffinity(nativeProfile, targetBranch) {
  const result = {
    base: 0,
    byCategory: { emotion: 0, career: 0, wealth: 0, comfort: 0 }
  };

  for (const branch of nativeProfile.branches || []) {
    if (!branch?.value) continue;
    const affinity = getBranchAffinityScore(branch.value, targetBranch);
    result.base += affinity.base * (branch.weight ?? 1);
    result.byCategory.emotion += (affinity.byCategory.emotion || 0) * (branch.weight ?? 1);
    result.byCategory.career += (affinity.byCategory.career || 0) * (branch.weight ?? 1);
    result.byCategory.wealth += (affinity.byCategory.wealth || 0) * (branch.weight ?? 1);
    result.byCategory.comfort += (affinity.byCategory.comfort || 0) * (branch.weight ?? 1);
  }

  return result;
}

function getBranchAffinityScore(nativeBranch, targetBranch) {
  const sixHe = {
    子: "丑", 丑: "子", 寅: "亥", 卯: "戌", 辰: "酉", 巳: "申",
    午: "未", 未: "午", 申: "巳", 酉: "辰", 戌: "卯", 亥: "寅"
  };
  const clashes = {
    子: "午", 丑: "未", 寅: "申", 卯: "酉", 辰: "戌", 巳: "亥",
    午: "子", 未: "丑", 申: "寅", 酉: "卯", 戌: "辰", 亥: "巳"
  };
  const harms = {
    子: "未", 丑: "午", 寅: "巳", 卯: "辰", 申: "亥", 酉: "戌",
    午: "丑", 未: "子", 巳: "寅", 辰: "卯", 亥: "申", 戌: "酉"
  };
  const groups = [
    ["申", "子", "辰"],
    ["亥", "卯", "未"],
    ["寅", "午", "戌"],
    ["巳", "酉", "丑"]
  ];

  const result = {
    base: 0,
    byCategory: { emotion: 0, career: 0, wealth: 0, comfort: 0 }
  };

  if (!nativeBranch || !targetBranch) {
    return result;
  }

  if (nativeBranch === targetBranch) {
    result.base += 9;
    result.byCategory.career += 4;
    result.byCategory.comfort += 6;
  }

  if (sixHe[nativeBranch] === targetBranch) {
    result.base += 16;
    result.byCategory.emotion += 8;
    result.byCategory.wealth += 4;
  }

  if (clashes[nativeBranch] === targetBranch) {
    result.base -= 18;
    result.byCategory.emotion -= 8;
    result.byCategory.career -= 6;
    result.byCategory.comfort -= 8;
  }

  if (harms[nativeBranch] === targetBranch) {
    result.base -= 10;
    result.byCategory.emotion -= 5;
    result.byCategory.career -= 3;
  }

  if (groups.some((group) => group.includes(nativeBranch) && group.includes(targetBranch))) {
    result.base += 10;
    result.byCategory.emotion += 4;
    result.byCategory.career += 4;
    result.byCategory.wealth += 3;
    result.byCategory.comfort += 5;
  }

  return result;
}

function buildHiddenStemProfile(nativeDayStem, branchValue) {
  const hiddenStems = (BRANCH_HIDDEN_STEMS[branchValue] || []).map((value, index) => {
    const detail = getStemDetail(value);
    return {
      ...detail,
      tenGod: getTenGod(nativeDayStem, value),
      weight: index === 0 ? 1 : index === 1 ? 0.7 : 0.45
    };
  });

  return {
    stems: hiddenStems,
    primary: hiddenStems[0] || null,
    tenGods: hiddenStems.map((item) => item.tenGod)
  };
}

function sumHiddenTenGodWeights(hiddenProfile, weightMap) {
  if (!hiddenProfile?.stems?.length) return 0;
  return hiddenProfile.stems.reduce((sum, item) => {
    return sum + ((weightMap[item.tenGod] ?? 0) * item.weight);
  }, 0);
}

function sumHiddenElementWeights(hiddenProfile, favorable, unfavorable) {
  if (!hiddenProfile?.stems?.length) return 0;
  return hiddenProfile.stems.reduce((sum, item) => {
    if (favorable.has(item.wuxing)) return sum + (8 * item.weight);
    if (unfavorable.has(item.wuxing)) return sum - (6 * item.weight);
    return sum;
  }, 0);
}

function sumChartElementResonance(nativeProfile, targetElement) {
  let score = 0;
  for (const item of nativeProfile.stems || []) {
    if (item.wuxing === targetElement) score += 5 * (item.weight ?? 1);
  }
  for (const item of nativeProfile.hidden || []) {
    if (item.wuxing === targetElement) score += 2.8 * (item.weight ?? 1);
  }
  return score;
}

function sumChartTenGodResonance(nativeProfile, weightMap) {
  let score = 0;
  for (const item of nativeProfile.stems || []) {
    score += (weightMap[item.tenGod] ?? 0) * (item.weight ?? 1);
  }
  for (const item of nativeProfile.hidden || []) {
    score += (weightMap[item.tenGod] ?? 0) * (item.weight ?? 1) * 0.7;
  }
  return score;
}

function scoreEmotionMatch({
  nativeProfile,
  stem,
  hiddenProfile,
  stemElement,
  branchElement,
  tenGod,
  branchAffinity,
  favorable,
  unfavorable
}) {
  let score = 0;
  if (favorable.has(stemElement)) score += 12;
  if (favorable.has(branchElement)) score += 8;
  if (unfavorable.has(stemElement)) score -= 10;
  if (unfavorable.has(branchElement)) score -= 6;
  score += sumHiddenElementWeights(hiddenProfile, favorable, unfavorable);
  score += sumChartElementResonance(nativeProfile, stemElement) * 0.18;
  score += sumChartElementResonance(nativeProfile, branchElement) * 0.12;

  score += branchAffinity.base * 0.45;
  score += branchAffinity.byCategory.emotion;

  const tenGodWeights = {
    正财: 18,
    偏财: 15,
    正官: 16,
    七杀: 10,
    正印: 11,
    偏印: 6,
    食神: 12,
    伤官: 4,
    比肩: 8,
    劫财: 3
  };
  score += tenGodWeights[tenGod] ?? 0;
  score += sumHiddenTenGodWeights(hiddenProfile, {
    正财: 10,
    偏财: 8,
    正官: 9,
    七杀: 5,
    正印: 6,
    偏印: 3,
    食神: 7,
    伤官: 1,
    比肩: 3,
    劫财: 0
  });
  score += sumChartTenGodResonance(nativeProfile, {
    正财: 1.8,
    偏财: 1.2,
    正官: 1.5,
    七杀: 0.6,
    正印: 0.9,
    偏印: 0.3,
    食神: 1.0,
    伤官: -0.1,
    比肩: 0.4,
    劫财: -0.4
  });

  if (stem.value === nativeProfile.dayStem) score += 2;
  if (hiddenProfile?.primary?.tenGod === "正财" || hiddenProfile?.primary?.tenGod === "正官") score += 4;
  return score;
}

function scoreCareerMatch({
  nativeProfile,
  stem,
  hiddenProfile,
  stemElement,
  branchElement,
  tenGod,
  branchAffinity,
  favorable,
  unfavorable
}) {
  let score = 0;
  if (favorable.has(stemElement)) score += 18;
  if (favorable.has(branchElement)) score += 12;
  if (unfavorable.has(stemElement)) score -= 12;
  if (unfavorable.has(branchElement)) score -= 8;
  score += sumHiddenElementWeights(hiddenProfile, favorable, unfavorable);
  score += sumChartElementResonance(nativeProfile, stemElement) * 0.22;
  score += sumChartElementResonance(nativeProfile, branchElement) * 0.14;

  score += branchAffinity.base * 0.35;
  score += branchAffinity.byCategory.career;

  const tenGodWeights = {
    正官: 18,
    七杀: 12,
    正印: 15,
    偏印: 12,
    比肩: 14,
    劫财: 7,
    食神: 10,
    伤官: 5,
    正财: 9,
    偏财: 6
  };
  score += tenGodWeights[tenGod] ?? 0;
  score += sumHiddenTenGodWeights(hiddenProfile, {
    正官: 10,
    七杀: 7,
    正印: 10,
    偏印: 8,
    比肩: 9,
    劫财: 4,
    食神: 6,
    伤官: 2,
    正财: 5,
    偏财: 3
  });
  score += sumChartTenGodResonance(nativeProfile, {
    正官: 1.9,
    七杀: 1.0,
    正印: 1.7,
    偏印: 1.2,
    比肩: 1.6,
    劫财: 0.5,
    食神: 0.8,
    伤官: 0.1,
    正财: 0.6,
    偏财: 0.2
  });

  if (stem.value === nativeProfile.dayStem) score += 7;
  if (tenGod === "比肩" || tenGod === "正印") score += 4;
  if (hiddenProfile?.primary?.tenGod === "正印" || hiddenProfile?.primary?.tenGod === "比肩") score += 5;
  return score;
}

function scoreWealthMatch({
  nativeProfile,
  hiddenProfile,
  stemElement,
  branchElement,
  tenGod,
  branchAffinity,
  favorable,
  unfavorable
}) {
  let score = 0;
  if (favorable.has(stemElement)) score += 24;
  if (favorable.has(branchElement)) score += 18;
  if (unfavorable.has(stemElement)) score -= 12;
  if (unfavorable.has(branchElement)) score -= 8;
  score += sumHiddenElementWeights(hiddenProfile, favorable, unfavorable);
  score += sumChartElementResonance(nativeProfile, stemElement) * 0.26;
  score += sumChartElementResonance(nativeProfile, branchElement) * 0.18;

  score += branchAffinity.base * 0.25;
  score += branchAffinity.byCategory.wealth;

  const tenGodWeights = {
    正财: 22,
    偏财: 18,
    食神: 16,
    伤官: 13,
    正官: 8,
    七杀: 5,
    正印: 6,
    偏印: 3,
    比肩: 4,
    劫财: -2
  };
  score += tenGodWeights[tenGod] ?? 0;
  score += sumHiddenTenGodWeights(hiddenProfile, {
    正财: 12,
    偏财: 10,
    食神: 10,
    伤官: 7,
    正官: 3,
    七杀: 1,
    正印: 2,
    偏印: 0,
    比肩: 1,
    劫财: -3
  });
  score += sumChartTenGodResonance(nativeProfile, {
    正财: 2.2,
    偏财: 1.8,
    食神: 1.5,
    伤官: 1.0,
    正官: 0.3,
    七杀: -0.1,
    正印: 0.2,
    偏印: -0.2,
    比肩: -0.2,
    劫财: -0.8
  });
  if (hiddenProfile?.primary?.tenGod === "正财" || hiddenProfile?.primary?.tenGod === "偏财") score += 6;
  return score;
}

function scoreComfortMatch({
  nativeProfile,
  stem,
  hiddenProfile,
  stemElement,
  branchElement,
  tenGod,
  branchAffinity,
  favorable,
  unfavorable
}) {
  let score = 0;
  if (favorable.has(stemElement)) score += 18;
  if (favorable.has(branchElement)) score += 14;
  if (unfavorable.has(stemElement)) score -= 14;
  if (unfavorable.has(branchElement)) score -= 10;
  score += sumHiddenElementWeights(hiddenProfile, favorable, unfavorable);
  score += sumChartElementResonance(nativeProfile, stemElement) * 0.24;
  score += sumChartElementResonance(nativeProfile, branchElement) * 0.16;

  score += branchAffinity.base * 0.5;
  score += branchAffinity.byCategory.comfort;

  const tenGodWeights = {
    正印: 18,
    偏印: 14,
    比肩: 12,
    食神: 13,
    正官: 9,
    七杀: 4,
    正财: 8,
    偏财: 6,
    劫财: 3,
    伤官: 6
  };
  score += tenGodWeights[tenGod] ?? 0;
  score += sumHiddenTenGodWeights(hiddenProfile, {
    正印: 11,
    偏印: 8,
    比肩: 8,
    食神: 9,
    正官: 4,
    七杀: 0,
    正财: 3,
    偏财: 2,
    劫财: 1,
    伤官: 3
  });
  score += sumChartTenGodResonance(nativeProfile, {
    正印: 2.0,
    偏印: 1.4,
    比肩: 1.1,
    食神: 1.4,
    正官: 0.5,
    七杀: -0.2,
    正财: 0.4,
    偏财: 0.2,
    劫财: -0.1,
    伤官: 0.2
  });

  if (stem.value === nativeProfile.dayStem) score += 5;
  if (hiddenProfile?.primary?.tenGod === "正印" || hiddenProfile?.primary?.tenGod === "食神") score += 5;
  return score;
}

function renderFlowInsightPanel(title, section, items, currentItem, result) {
  if (!items.length || !currentItem) {
    return `
      <article class="flow-insight-panel">
        <div class="flow-insight-head"><h4>${title}</h4></div>
        <div class="info-note">暂无可显示的分析结果。</div>
      </article>
    `;
  }
  const index = flowPanelState[section] ?? 0;
  const headline = buildFlowInsightHeadline(section, currentItem);
  const body = buildFlowInsightPanelBody(section, currentItem, result);
  const vipLocked = !isFlowInsightVipAvailable();
  const badgeHtml = getFlowInsightBadgeHtml();

  return `
    <article class="flow-insight-panel">
      <div class="flow-insight-head">
        <h4>${title}<span class="flow-insight-inline">（${escapeHtml(headline)}）</span>${badgeHtml}</h4>
        <div class="flow-insight-nav">
          <button type="button" class="flow-nav-btn ${vipLocked ? "is-vip-locked" : ""}" data-flow-panel-nav="${section}" data-flow-direction="prev" aria-label="${vipLocked ? "VIP解锁上一项" : "上一项"}" title="${vipLocked ? "VIP 功能" : "上一项"}"><span>‹</span></button>
          <button type="button" class="flow-nav-btn ${vipLocked ? "is-vip-locked" : ""}" data-flow-panel-nav="${section}" data-flow-direction="next" aria-label="${vipLocked ? "VIP解锁下一项" : "下一项"}" title="${vipLocked ? "VIP 功能" : "下一项"}"><span>›</span></button>
        </div>
      </div>
      <div class="flow-insight-meta">${escapeHtml(`${index + 1} / ${items.length}`)}</div>
      ${body}
    </article>
  `;
}

function buildFlowInsightPanelBody(section, item, result) {
  const isVip = isFlowInsightVipAvailable();
  const isCurrentStage = isCurrentFlowInsightItem(section, item, result);
  if (!isVip && !isCurrentStage) {
    return `
      <div class="flow-insight-preview-shell is-locked">
        <div class="flow-insight-metrics is-blurred">${buildFlowMetricCards(section, item, result)}</div>
        <div class="flow-insight-vip-mask">
          <span class="flow-insight-vip-mask-badge">VIP特权</span>
          <p>开通会员后解锁该阶段完整分析</p>
        </div>
      </div>
    `;
  }

  const cacheEntry = getFlowInsightCacheEntry(section, item);
  const sectionText = section === "dayun" ? "大运" : section === "liunian" ? "流年" : "流月";

  if (!cacheEntry) {
    return `
      <div class="flow-insight-state is-empty">
        <div class="flow-insight-state-copy">
          <h5>点击生成分析</h5>
          <p>结合当前命盘与所选${sectionText}阶段，逐项生成运势、财运、情感、事业、健康与综合批语。</p>
        </div>
        <button type="button" class="primary-btn bazi-generate-btn flow-insight-generate-btn" data-flow-insight-generate="${section}">点击生成分析</button>
      </div>
    `;
  }

  if (cacheEntry.status === "loading") {
    return `
      <div class="flow-insight-state is-loading">
        <div class="flow-insight-spinner" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="flow-insight-state-copy">
          <h5>分析生成中</h5>
          <p>正在调用青筮AI模型，结合当前命盘与${sectionText}信息进行即时推演，请稍候片刻。</p>
        </div>
      </div>
    `;
  }

  if (cacheEntry.status === "error") {
    return `
      <div class="flow-insight-state is-error">
        <div class="flow-insight-state-copy">
          <h5>分析失败</h5>
          <p>${escapeHtml(cacheEntry.error || "可能是 API 余额不足或服务暂时不可用。")}</p>
        </div>
        <button type="button" class="primary-btn bazi-generate-btn flow-insight-generate-btn" data-flow-insight-generate="${section}" data-flow-generate-force="retry">重新生成</button>
      </div>
    `;
  }

  return `<div class="flow-insight-metrics">${buildFlowMetricCards(section, item, result)}</div>`;
}

function buildFlowInsightHeadline(section, item) {
  if (section === "dayun") return `当前：${item.ganzhi}大运 ${item.startYear}-${item.endYear}`;
  if (section === "liunian") return `当前：${item.year}年 ${item.ganzhi}`;
  const term = item.solarTerm || item.monthChinese || "流月";
  const dateText = formatFlowMonthDayLabel(
    item.solarDateLabel || item.rangeLabel || item.dateRange || item.solarRange || item.dateLabel || item.solarDate || ""
  );
  return `当前：${term}${dateText && dateText !== "—" ? ` ${dateText}` : ""} ${item.ganzhi}`;
}

function isCurrentFlowInsightItem(section, item, result) {
  if (!item || !result) return false;
  if (section === "dayun") {
    const current = result.flowAnalysis?.supported ? result.flowAnalysis.currentDaYun : null;
    return current?.ganzhi === item.ganzhi && current?.startYear === item.startYear;
  }
  if (section === "liunian") {
    const current = result.flowAnalysis?.supported ? result.flowAnalysis.currentLiuNian : null;
    return current?.year === item.year;
  }
  const current = pickCurrentMonth(result.flowAnalysis?.supported ? result.flowAnalysis.liuYue : []);
  return current?.ganzhi === item.ganzhi && current?.monthChinese === item.monthChinese;
}

function buildFlowMetricCards(section, item, result) {
  const insight = item.flowInsight || { favorability: "neutral", score: 0, note: "" };
  const stars = scoreToStars(insight.score);
  const tone = insight.favorability || "neutral";
  const favorable = (result.strengthAnalysis?.favorableElements || []).map((entry) => entry.name).join("、");
  const aiMetrics = getFlowInsightCachedMetrics(section, item);
  const metrics = [
    ["运势", aiMetrics?.overall || buildFlowDimensionText(section, tone, "overall", favorable)],
    ["财运", aiMetrics?.wealth || buildFlowDimensionText(section, tone, "wealth", favorable)],
    ["情感", aiMetrics?.emotion || buildFlowDimensionText(section, tone, "emotion", favorable)],
    ["事业", aiMetrics?.career || buildFlowDimensionText(section, tone, "career", favorable)],
    ["健康", aiMetrics?.health || buildFlowDimensionText(section, tone, "health", favorable)],
    ["综合", aiMetrics?.summary || `综合运势：${"★".repeat(stars)}${"☆".repeat(5 - stars)}（${stars}星）\n${buildFlowDimensionText(section, tone, "summary", favorable)}`]
  ];

  return metrics
    .map(
      ([label, text]) => `
        <article class="flow-metric-card">
          <div class="flow-metric-icon tone-${tone}">
            <span class="flow-metric-mini-title">${label}</span>
          </div>
          <div class="flow-metric-copy">
            <p>${escapeHtml(text)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function buildFlowDimensionText(section, tone, dimension, favorable) {
  const stageText = section === "dayun" ? "这一阶段" : section === "liunian" ? "这一年" : "这个月";
  const favored = favorable || "喜用五行";
  const templates = {
    favorable: {
      overall: `${stageText}整体顺势，适合主动推进与放大优势。`,
      wealth: `财运偏稳，容易在 ${favored} 相关方向看到正向回报。`,
      emotion: `情感更易推进，沟通与靠近感都比平时顺手。`,
      career: `事业承接度较好，适合争取机会、落实计划。`,
      health: `身心状态较稳，宜保持规律作息与节奏。`,
      summary: `整体窗口偏佳，把握节奏比蛮力推进更有效。`
    },
    challenging: {
      overall: `${stageText}波动偏多，宜稳中求进，少做冒进决断。`,
      wealth: `财务上更要重视收支平衡，避免冲动投入。`,
      emotion: `情绪和关系容易敏感，宜把话说明白，少压着不说。`,
      career: `事业上压力感会更强，适合先守结构、再求突破。`,
      health: `注意体力消耗与作息紊乱，宜减少过载。`,
      summary: `这段时间更适合校正、收束与慢调，不宜硬冲。`
    },
    neutral: {
      overall: `${stageText}整体偏平稳，关键看选择与执行节奏。`,
      wealth: `财运中性，宜以稳健经营和持续积累为主。`,
      emotion: `情感层面宜保持稳定互动，重在理解与回应。`,
      career: `事业适合按部就班推进，逐步放大确定性。`,
      health: `身体状态总体平稳，注意劳逸平衡即可。`,
      summary: `阶段中性，做对选择比盲目发力更重要。`
    }
  };
  return templates[tone]?.[dimension] || templates.neutral[dimension];
}

function scoreToStars(score) {
  if (score >= 1.45) return 5;
  if (score >= 0.7) return 4;
  if (score >= -0.15) return 3;
  if (score >= -0.9) return 2;
  return 1;
}

function renderShenshaLegendMini() {
  return `
    <div class="shensha-legend-mini">
      <span><i class="is-auspicious"></i>紫色为吉神，偏助力、贵人、机缘。</span>
      <span><i class="is-neutral"></i>白色为中性，偏环境、性情、条件。</span>
      <span><i class="is-inauspicious"></i>红色为凶神，偏阻滞、冲克、风险。</span>
    </div>
  `;
}

function renderFlowMonthCompareTable(items, dayMasterStem) {
  if (!items?.length) {
    return '<div class="flow-compare-empty">—</div>';
  }
  const visibleItems = items.slice(0, 12);
  return `
    <table class="flow-mini-table flow-month-mini-table">
      <thead>
        <tr>
          <th>月</th>
          <th>天干</th>
          <th>地支</th>
          <th>纳音</th>
          <th>空亡</th>
          <th>神煞</th>
        </tr>
      </thead>
      <tbody>
        ${visibleItems
          .map((item) => {
            const detail = buildFlowDetail(item.ganzhi, dayMasterStem);
            return `
              <tr>
                <th>${escapeHtml(item.monthChinese || "月")}</th>
                <td>${largeGanzhiCell(detail.stem.value, detail.stem.colorHex)}</td>
                <td>${largeGanzhiCell(detail.branch.value, detail.branch.colorHex)}</td>
                <td>${detail.nayin}</td>
                <td>${item.xunKong || "—"}</td>
                <td>${renderShenshaTags(item.shenShaAnalysis?.commonItems || [])}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderFlowReferencePanel(result, currentDaYun, currentLiuNian, currentLiuYue, dayMasterStem) {
  const daYunItems = ((result.daYun?.supported ? result.daYun.daYun : []) || []);
  const liuNianItems = ((result.flowAnalysis?.liuNianTimeline || []) || []);
  const liuYueItems = ((result.flowAnalysis?.liuYue || []) || []).slice(0, 12);
  const daYunTimeline = padFlowWindow(daYunItems.slice(0, 10), 10);
  const liuNianWindow = padFlowWindow(getFlowWindow(
    liuNianItems,
    liuNianItems.findIndex((item) => item?.year === currentLiuNian?.year),
    10
  ), 10);
  const liuYueWindow = padFlowWindow(liuYueItems, 12);

  return `
    <div class="flow-reference-panel">
      <div class="flow-reference-head">
        <div>
          <h3>流运对照</h3>
          <p class="muted">采用独立前端对照栏展示，版式与左侧排盘明细区分开，并保持在总八字边框内运行。</p>
        </div>
      </div>

      ${renderFlowTimelineSection(
        "大运",
        daYunItems[0]?.startYear && daYunItems[0]?.startAge !== undefined ? `${daYunItems[0].startYear}年 · ${daYunItems[0].startAge}岁起运` : "第一步大运起排",
        daYunTimeline.map((item) => buildDaYunReferenceCard(item, currentDaYun, dayMasterStem))
      )}

      ${renderFlowTimelineSection(
        "流年 / 小运",
        currentLiuNian?.year ? `${currentLiuNian.year}年在位` : "当前流年",
        liuNianWindow.map((item) => buildLiuNianReferenceCard(item, currentLiuNian, dayMasterStem))
      )}

      ${renderFlowTimelineSection(
        "流月",
        currentLiuYue?.monthChinese ? `${currentLiuYue.monthChinese}当令` : "本年流月",
        liuYueWindow.map((item, index) => buildLiuYueReferenceCard(item, index, currentLiuYue, dayMasterStem))
      )}
    </div>
  `;
}

function renderFlowTimelineSection(title, summary, cards) {
  const sectionClass =
    title === "大运"
      ? "is-dayun-section"
      : title === "流年 / 小运"
        ? "is-liunian-section"
        : "is-liuyue-section";
  return `
    <section class="flow-reference-section ${sectionClass}">
      <div class="flow-reference-section-head">
        <h4>${title}</h4>
        <span class="muted">${summary || "—"}</span>
      </div>
      <div class="flow-reference-card-strip">
        ${(cards || []).join("")}
      </div>
    </section>
  `;
}

function getFlowWindow(items, currentIndex, targetLength) {
  if (!items?.length) return [];
  if (items.length <= targetLength) return items;
  const safeIndex = currentIndex >= 0 ? currentIndex : Math.floor(items.length / 2);
  let start = safeIndex - 4;
  let end = start + targetLength;
  if (start < 0) {
    start = 0;
    end = targetLength;
  }
  if (end > items.length) {
    end = items.length;
    start = Math.max(0, end - targetLength);
  }
  return items.slice(start, end);
}

function extendDaYunItems(items, targetLength) {
  const normalized = [...(items || [])];
  if (!normalized.length) return normalized;
  while (normalized.length < targetLength) {
    const previous = normalized[normalized.length - 1];
    normalized.push(buildNextDaYunItem(previous));
  }
  return normalized;
}

function buildNextDaYunItem(previous) {
  const previousGanzhi = previous?.ganzhi || "";
  const prevStem = previousGanzhi[0] || "";
  const prevBranch = previousGanzhi[1] || "";
  const nextStem = STEM_ORDER[(STEM_ORDER.indexOf(prevStem) + 1 + STEM_ORDER.length) % STEM_ORDER.length] || prevStem;
  const nextBranch = BRANCH_ORDER[(BRANCH_ORDER.indexOf(prevBranch) + 1 + BRANCH_ORDER.length) % BRANCH_ORDER.length] || prevBranch;
  const nextStartYear = Number(previous?.startYear || 0) + 10;
  const nextEndYear = Number(previous?.endYear || nextStartYear + 9) + 10;
  const nextStartAge = Number(previous?.startAge || 0) + 10;
  const nextEndAge = Number(previous?.endAge || nextStartAge + 9) + 10;

  return {
    ...previous,
    index: Number(previous?.index || 0) + 1,
    ganzhi: `${nextStem}${nextBranch}`,
    startYear: nextStartYear,
    endYear: nextEndYear,
    startAge: nextStartAge,
    endAge: nextEndAge,
    flowInsight: previous?.flowInsight || null,
    shenShaAnalysis: previous?.shenShaAnalysis || null,
    xunKong: previous?.xunKong || "—"
  };
}

function padFlowWindow(items, targetLength) {
  const normalized = [...(items || [])];
  while (normalized.length < targetLength) {
    normalized.push(null);
  }
  return normalized.slice(0, targetLength);
}

function buildDaYunReferenceCard(item, currentDaYun, dayMasterStem) {
  if (!item) return `<article class="flow-mini-card is-empty"></article>`;
  const stemText = renderFlowStemCompact(item.ganzhi?.[0], dayMasterStem);
  const branchText = renderFlowBranchCompact(item.ganzhi?.[1], dayMasterStem);
  return `
      <article class="flow-mini-card flow-mini-card-dayun ${currentDaYun?.ganzhi === item.ganzhi && currentDaYun?.startYear === item.startYear ? "is-active" : ""}">
        <p class="flow-mini-card-top">${escapeHtml(item.startYear ? `${item.startYear}` : `第${(item.index || 0) + 1}运`)}</p>
        <p class="flow-mini-card-sub">${escapeHtml(item.startAge !== undefined ? `${item.startAge}岁` : "—")}</p>
        <div class="flow-mini-card-body flow-mini-card-body-dayun">
          <div class="flow-mini-card-line flow-mini-card-line-compact">${stemText}</div>
          <div class="flow-mini-card-line flow-mini-card-line-compact">${branchText}</div>
        </div>
      </article>
    `;
}

function buildLiuNianReferenceCard(item, currentLiuNian, dayMasterStem) {
  if (!item) return `<article class="flow-mini-card is-empty"></article>`;
  const stemText = renderFlowStemCompact(item.ganzhi?.[0], dayMasterStem);
  const branchText = renderFlowBranchCompact(item.ganzhi?.[1], dayMasterStem);
  return `
      <article class="flow-mini-card ${currentLiuNian?.year === item.year ? "is-active" : ""}">
        <p class="flow-mini-card-top">${escapeHtml(item.year ? `${item.year}` : "—")}</p>
        <p class="flow-mini-card-sub">${escapeHtml(item.age !== undefined ? `${item.age}岁` : "—")}</p>
        <div class="flow-mini-card-body">
          <div class="flow-mini-card-line flow-mini-card-line-compact">${stemText}</div>
          <div class="flow-mini-card-line flow-mini-card-line-compact flow-mini-card-line-branch">${branchText}</div>
        </div>
        <p class="flow-mini-card-ganzhi flow-mini-card-ganzhi-small">${renderInlineGanzhiText(item.ganzhi)}</p>
      </article>
    `;
}

function buildLiuYueReferenceCard(item, index, currentLiuYue, dayMasterStem) {
  if (!item) return `<article class="flow-mini-card is-empty"></article>`;
  const stemText = renderFlowStemCompact(item.ganzhi?.[0], dayMasterStem);
  const branchText = renderFlowBranchCompact(item.ganzhi?.[1], dayMasterStem);
  const dateText = formatFlowMonthDayLabel(
    item.solarDateLabel || item.rangeLabel || item.dateRange || item.solarRange || item.dateLabel || item.solarDate || ""
  );
  return `
      <article class="flow-mini-card ${currentLiuYue?.ganzhi === item.ganzhi && currentLiuYue?.monthChinese === item.monthChinese ? "is-active" : ""}">
        <p class="flow-mini-card-top">${escapeHtml(item.solarTerm || item.monthChinese || item.jieQi || `第${index + 1}月`)}</p>
        <p class="flow-mini-card-sub">${escapeHtml(dateText)}</p>
        <div class="flow-mini-card-body">
          <div class="flow-mini-card-line flow-mini-card-line-compact">${stemText}</div>
          <div class="flow-mini-card-line flow-mini-card-line-compact flow-mini-card-line-branch">${branchText}</div>
        </div>
      </article>
    `;
}

function renderFlowStemLine(stemValue, dayMasterStem) {
  const stem = getStemDetail(stemValue);
  const tenGod = getTenGod(dayMasterStem, stemValue);
  return `<span style="color:${stem.colorHex}">${escapeHtml(`${stem.value}${stem.wuxing}（${tenGod}）`)}</span>`;
}

function renderFlowStemCompact(stemValue, dayMasterStem) {
  const stem = getStemDetail(stemValue);
  const tenGod = simplifyTenGod(getTenGod(dayMasterStem, stemValue));
  return `
    <span class="flow-compact-pair">
      <span class="flow-compact-char" style="color:${stem.colorHex}">${escapeHtml(stem.value)}</span>
      <span class="flow-compact-tengod">${escapeHtml(tenGod)}</span>
    </span>
  `;
}

function renderFlowBranchLine(branchValue, dayMasterStem) {
  const hiddenStems = (BRANCH_HIDDEN_STEMS[branchValue] || []).map((item) => {
    const stem = getStemDetail(item);
    const tenGod = getTenGod(dayMasterStem, item);
    return `<span style="color:${stem.colorHex}">${escapeHtml(`${stem.value}${stem.wuxing}（${tenGod}）`)}</span>`;
  });
  if (!hiddenStems.length) {
    const branchMeta = BRANCH_META[branchValue] || { colorHex: "#d8b66d" };
    return `<span style="color:${branchMeta.colorHex}">${escapeHtml(branchValue || "—")}</span>`;
  }
  return hiddenStems.join("<br>");
}

function renderFlowBranchCompact(branchValue, dayMasterStem) {
  const mainHiddenStem = (BRANCH_HIDDEN_STEMS[branchValue] || [])[0];
  const branchMeta = BRANCH_META[branchValue] || { colorHex: "#d8b66d" };
  if (!mainHiddenStem) {
    return `
      <span class="flow-compact-pair">
        <span class="flow-compact-char" style="color:${branchMeta.colorHex}">${escapeHtml(branchValue || "—")}</span>
      </span>
    `;
  }
  const tenGod = simplifyTenGod(getTenGod(dayMasterStem, mainHiddenStem));
  return `
    <span class="flow-compact-pair">
      <span class="flow-compact-char" style="color:${branchMeta.colorHex}">${escapeHtml(branchValue)}</span>
      <span class="flow-compact-tengod">${escapeHtml(tenGod)}</span>
    </span>
  `;
}

function renderInlineGanzhiText(ganzhi) {
  if (!ganzhi) return "—";
  return escapeHtml(ganzhi);
}

function formatFlowMonthDayLabel(input) {
  const text = String(input || "").trim();
  const match = text.match(/(\d{1,2})\D+(\d{1,2})/);
  if (match) {
    return `${Number(match[1])}/${Number(match[2])}`;
  }
  return text || "—";
}

function simplifyTenGod(tenGod) {
  const map = {
    比肩: "比",
    劫财: "劫",
    食神: "食",
    伤官: "伤",
    偏财: "才",
    正财: "财",
    七杀: "杀",
    正官: "官",
    偏印: "枭",
    正印: "印"
  };
  return map[tenGod] || tenGod || "—";
}

function getShenshaToneClass(tone) {
  if (tone === "吉") return "tone-auspicious";
  if (tone === "凶") return "tone-inauspicious";
  return "tone-neutral";
}

function getShenshaTone(item) {
  const auspicious = [
    "tianyi",
    "taiji",
    "jiangxing",
    "wenchang",
    "lushen",
    "hongluan",
    "tianxi",
    "xuetang",
    "ciguan",
    "jinyu",
    "guoyin",
    "tianchu",
    "fuxing",
    "yuede",
    "tiande",
    "dexiu",
    "tianshe",
    "shiling",
    "tianyi-medical"
  ];
  const inauspicious = [
    "yangren",
    "jiesha",
    "zaisha",
    "wangshen",
    "guchen",
    "guasu",
    "tianluo",
    "diwang",
    "sangmen",
    "diaoke",
    "liuxia",
    "guluan",
    "yinchayangcuo"
  ];
  if (auspicious.includes(item.key)) return "auspicious";
  if (inauspicious.includes(item.key)) return "inauspicious";
  return "neutral";
}

function pickCurrentMonth(months) {
  if (!months?.length) return null;
  const currentMonth = new Date().getMonth() + 1;
  return months.find((item) => Number(item.monthOrder) === currentMonth) || months[0];
}

function largeGanzhiCell(text, color) {
  return `<span class="board-ganzhi" style="color:${color || "#f0e0b7"}">${text}</span>`;
}

function coloredCell(text, color) {
  return `<span style="color:${color || "#e0d2b2"}">${text}</span>`;
}

function toneClass(tone) {
  if (tone === "good") return "tone-good";
  if (tone === "care") return "tone-care";
  return "tone-neutral";
}

function toneText(tone) {
  if (tone === "favorable" || tone === "good") return "顺势";
  if (tone === "challenging" || tone === "care") return "注意";
  return "中性";
}

function toggleFieldsetDisabled(container, disabled) {
  container.querySelectorAll(".field").forEach((field) => {
    field.classList.toggle("is-disabled", disabled);
  });

  container.querySelectorAll("input, select").forEach((element) => {
    element.disabled = disabled;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}








