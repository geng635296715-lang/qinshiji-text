import { Lunar, Solar } from "lunar-typescript";
import type { AdviceScope, CalendarType } from "../../shared/types/domain.js";
import { analyzeBazi } from "../bazi/service.js";

type Gender = "male" | "female" | "other";
type Tone = "good" | "neutral" | "care";
type FlowTone = "favorable" | "neutral" | "challenging";
type WuXingName = "木" | "火" | "土" | "金" | "水";
type AdviceCategoryKey =
  | "signing"
  | "meeting"
  | "travel"
  | "wealth"
  | "communication"
  | "love"
  | "study"
  | "healing"
  | "decision";

export type QingzhiAdviceInput = {
  userId?: string;
  scope: AdviceScope;
  date: string;
  profile: {
    calendarType: CalendarType;
    birthDate: string;
    birthTime: string;
    gender: Gender;
    birthPlace: string;
  };
};

type AdviceBadge = {
  label: string;
  value: string;
  tone: Tone;
};

type AdviceCategoryDefinition = {
  key: AdviceCategoryKey;
  label: string;
  keywords: string[];
  cautionKeywords: string[];
  summary: string;
};

const STYLE_BY_ELEMENT: Record<WuXingName, string[]> = {
  木: ["舒展自然", "轻盈层次", "线条柔和"],
  火: ["明快利落", "适度亮点", "有存在感"],
  土: ["稳重简洁", "质感厚实", "轮廓端正"],
  金: ["清爽克制", "剪裁明确", "干净精致"],
  水: ["流动垂感", "深浅叠搭", "含蓄冷静"]
};

const ACCESSORY_BY_ELEMENT: Record<WuXingName, string[]> = {
  木: ["木质配饰", "青绿色小饰品", "植物感元素"],
  火: ["暖色金属", "红色系点缀", "轻亮面材质"],
  土: ["玉石系配饰", "陶感材质", "米棕色稳重配件"],
  金: ["银色金属", "简约几何首饰", "白金色配件"],
  水: ["黑蓝色配饰", "低调光泽材质", "流线感饰物"]
};

const DIRECTION_BY_ELEMENT: Record<WuXingName, { direction: string; scenes: string[] }> = {
  木: { direction: "东 / 东南", scenes: ["学习规划", "关系修复", "长期成长"] },
  火: { direction: "南", scenes: ["表达展示", "见重要人", "推动合作"] },
  土: { direction: "中宫 / 西南 / 东北", scenes: ["稳定事务", "落地执行", "整理资源"] },
  金: { direction: "西 / 西北", scenes: ["规则确认", "合同细节", "决策复盘"] },
  水: { direction: "北", scenes: ["信息搜集", "沉淀思考", "调整节奏"] }
};

const DAILY_ACTIONS = {
  good: ["宜沟通", "宜整理", "宜观察节奏", "宜推进小决定", "宜见重要人"],
  care: ["忌冲动消费", "忌情绪上头", "忌口舌争执", "忌同时开太多线", "忌仓促答应"]
};

const STEM_BRANCH_ELEMENT_MAP: Record<string, WuXingName> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水"
};

const ELEMENT_COLORS: Record<WuXingName, { name: string; hex: string }> = {
  木: { name: "青绿", hex: "#2F9E44" },
  火: { name: "朱红", hex: "#D94841" },
  土: { name: "赭黄", hex: "#C27C2C" },
  金: { name: "鎏金", hex: "#C9A227" },
  水: { name: "玄蓝", hex: "#2B6CB0" }
};

const ADVICE_CATEGORIES: AdviceCategoryDefinition[] = [
  {
    key: "signing",
    label: "签约立项",
    keywords: ["订盟", "交易", "立券", "纳财", "开市", "签约", "求嗣", "赴任"],
    cautionKeywords: ["破土", "词讼", "争执", "安葬"],
    summary: "适合签约、定计划、确认边界与责任。"
  },
  {
    key: "meeting",
    label: "见人会面",
    keywords: ["会友", "见贵", "纳采", "嫁娶", "祭祀", "祈福", "出行"],
    cautionKeywords: ["词讼", "争执", "破败"],
    summary: "适合面谈、拜访、见关键人物和关系推进。"
  },
  {
    key: "travel",
    label: "出行走动",
    keywords: ["出行", "移徙", "入宅", "开光", "修造", "动土"],
    cautionKeywords: ["闭日", "破日", "安床", "掘井"],
    summary: "适合外出、调场地、换环境、现场推进。"
  },
  {
    key: "wealth",
    label: "求财经营",
    keywords: ["纳财", "交易", "开市", "立券", "牧养", "栽种", "求财"],
    cautionKeywords: ["破财", "耗散", "词讼"],
    summary: "适合经营、谈回款、做销售与现实收益相关事务。"
  },
  {
    key: "communication",
    label: "沟通表达",
    keywords: ["会友", "祈福", "订盟", "赴任", "祭祀", "求医"],
    cautionKeywords: ["词讼", "争执", "官非"],
    summary: "适合沟通说明、表达态度、缓和误解与口头推进。"
  },
  {
    key: "love",
    label: "情感推进",
    keywords: ["嫁娶", "纳采", "订盟", "会友", "祈福"],
    cautionKeywords: ["词讼", "破败", "离别"],
    summary: "适合表态、约会、关系修复、明确关系走向。"
  },
  {
    key: "study",
    label: "学习考试",
    keywords: ["祭祀", "祈福", "开光", "出行", "赴任", "栽种"],
    cautionKeywords: ["争执", "耗散", "破败"],
    summary: "适合学习、备考、整理知识框架、做长期规划。"
  },
  {
    key: "healing",
    label: "休整疗愈",
    keywords: ["求医", "祭祀", "祈福", "斋醮", "沐浴"],
    cautionKeywords: ["开市", "强推进", "冒险"],
    summary: "适合调休、体检、做恢复与身心整理。"
  },
  {
    key: "decision",
    label: "当前决断",
    keywords: ["订盟", "赴任", "交易", "立券", "开市", "移徙"],
    cautionKeywords: ["词讼", "争执", "破日", "四离"],
    summary: "适合做决策，但要结合自身节奏和风险承受力。"
  }
];

function parseYmd(date: string) {
  const match = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    throw new Error("date must use YYYY-MM-DD");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function parseGanzhiElement(ganzhi: string) {
  const gan = ganzhi[0];
  const zhi = ganzhi[1];

  return {
    ganElement: STEM_BRANCH_ELEMENT_MAP[gan],
    zhiElement: STEM_BRANCH_ELEMENT_MAP[zhi]
  };
}

function buildScore(favorableCount: number, challengingCount: number) {
  return Math.max(48, Math.min(92, 68 + favorableCount * 8 - challengingCount * 6));
}

function pickRecommendedColors(elements: WuXingName[]) {
  return elements.map((element) => ({
    element,
    ...ELEMENT_COLORS[element]
  }));
}

function buildMonthlyHighlights(
  baseYear: number,
  liuYue: Array<{ monthChinese: string; flowInsight: { favorability: FlowTone; note: string; ganzhi: string } }>
) {
  return liuYue.map((item) => ({
    month: item.monthChinese,
    ganzhi: item.flowInsight.ganzhi,
    tone:
      item.flowInsight.favorability === "favorable"
        ? "good"
        : item.flowInsight.favorability === "challenging"
          ? "care"
          : "neutral",
    note: `${baseYear}年${item.monthChinese}月：${item.flowInsight.note}`
  }));
}

function normalizeActionList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function buildDayScore(lunar: Lunar, favorableElements: WuXingName[], unfavorableElements: WuXingName[]) {
  const dayGanzhi = lunar.getDayInGanZhi();
  const { ganElement, zhiElement } = parseGanzhiElement(dayGanzhi);

  let score = 66;
  let favorableHits = 0;
  let unfavorableHits = 0;

  if (ganElement && favorableElements.includes(ganElement)) {
    score += 8;
    favorableHits += 1;
  }
  if (zhiElement && favorableElements.includes(zhiElement)) {
    score += 6;
    favorableHits += 1;
  }
  if (ganElement && unfavorableElements.includes(ganElement)) {
    score -= 7;
    unfavorableHits += 1;
  }
  if (zhiElement && unfavorableElements.includes(zhiElement)) {
    score -= 5;
    unfavorableHits += 1;
  }

  const normalized = Math.max(45, Math.min(92, score));
  const tone: Tone = normalized >= 78 ? "good" : normalized >= 63 ? "neutral" : "care";

  return {
    score: normalized,
    tone,
    summary:
      tone === "good"
        ? "这一天更适合安排推进型事项。"
        : tone === "care"
          ? "这一天更适合保守处理，减少硬碰硬。"
          : "这一天适合稳中求进，边看边调。",
    recommendedTag:
      favorableHits > unfavorableHits ? "可主动" : unfavorableHits > favorableHits ? "宜保守" : "宜平衡"
  };
}

function scoreCategoryForDay(category: AdviceCategoryDefinition, yi: string[], ji: string[], score: number, tone: Tone) {
  const yiText = yi.join("|");
  const jiText = ji.join("|");

  const positive = category.keywords.reduce(
    (sum, keyword) => (yiText.includes(keyword) ? sum + 18 : sum),
    0
  );
  const caution = category.cautionKeywords.reduce(
    (sum, keyword) => (jiText.includes(keyword) ? sum + 15 : sum),
    0
  );
  const toneOffset = tone === "good" ? 8 : tone === "care" ? -8 : 0;
  const total = Math.max(35, Math.min(96, Math.round(score * 0.55 + positive - caution + toneOffset)));
  const level: Tone = total >= 78 ? "good" : total >= 62 ? "neutral" : "care";

  return {
    key: category.key,
    label: category.label,
    score: total,
    tone: level,
    summary:
      level === "good"
        ? `${category.summary} 当前可重点使用。`
        : level === "care"
          ? `${category.summary} 但这一天不宜强推，宜降低预期。`
          : `${category.summary} 可做铺垫或轻量推进。`
  };
}

function buildDayCategories(yi: string[], ji: string[], score: number, tone: Tone) {
  return ADVICE_CATEGORIES.map((category) => scoreCategoryForDay(category, yi, ji, score, tone))
    .sort((a, b) => b.score - a.score);
}

function buildSevenDayCalendar(centerSolar: Solar, favorableElements: WuXingName[], unfavorableElements: WuXingName[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 3;
    const solar = centerSolar.next(offset);
    const lunar = solar.getLunar();
    const yi = normalizeActionList(lunar.getDayYi());
    const ji = normalizeActionList(lunar.getDayJi());
    const scoreMeta = buildDayScore(lunar, favorableElements, unfavorableElements);
    const categories = buildDayCategories(yi, ji, scoreMeta.score, scoreMeta.tone);

    return {
      offset,
      isToday: offset === 0,
      solar: solar.toYmd(),
      lunar: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      week: lunar.getWeekInChinese(),
      ganzhiDay: lunar.getDayInGanZhi(),
      jieQi: lunar.getJieQi() || null,
      score: scoreMeta.score,
      tone: scoreMeta.tone,
      summary: scoreMeta.summary,
      yi: yi.slice(0, 5),
      ji: ji.slice(0, 5),
      recommendedTag: scoreMeta.recommendedTag,
      recommendedCategories: categories.slice(0, 3),
      categoryScores: categories
    };
  });
}

function buildAuspiciousCategories(calendar: ReturnType<typeof buildSevenDayCalendar>) {
  return ADVICE_CATEGORIES.map((category) => {
    const ranked = [...calendar]
      .map((day) => ({
        solar: day.solar,
        week: day.week,
        ganzhiDay: day.ganzhiDay,
        item: day.categoryScores.find((entry) => entry.key === category.key)!
      }))
      .sort((a, b) => b.item.score - a.item.score);

    const best = ranked[0];
    const caution = ranked[ranked.length - 1];

    return {
      key: category.key,
      label: category.label,
      summary: category.summary,
      bestDay: {
        solar: best.solar,
        week: best.week,
        ganzhiDay: best.ganzhiDay,
        score: best.item.score,
        tone: best.item.tone,
        summary: best.item.summary
      },
      cautionDay: {
        solar: caution.solar,
        week: caution.week,
        ganzhiDay: caution.ganzhiDay,
        score: caution.item.score,
        tone: caution.item.tone,
        summary: caution.item.summary
      }
    };
  });
}

function buildAuspiciousAdvice(calendar: ReturnType<typeof buildSevenDayCalendar>) {
  const bestDays = [...calendar]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({
      solar: item.solar,
      week: item.week,
      score: item.score,
      reason: `${item.ganzhiDay}日气场更顺，适合安排 ${item.yi.slice(0, 2).join("、") || "重要事项"}。`,
      topCategories: item.recommendedCategories
    }));

  const cautionDays = [...calendar]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((item) => ({
      solar: item.solar,
      week: item.week,
      score: item.score,
      reason: `${item.ganzhiDay}更适合降低冲动，少做高压决断。`,
      cautionCategories: item.categoryScores.slice(-2)
    }));

  return {
    bestDays,
    cautionDays,
    categoryBreakdown: buildAuspiciousCategories(calendar)
  };
}

function buildDirectionSceneAdvice(favorableElements: WuXingName[], monthTone: FlowTone | null) {
  const primary = favorableElements[0] ?? "土";
  const secondary = favorableElements[1] ?? primary;
  const primaryMap = DIRECTION_BY_ELEMENT[primary];
  const secondaryMap = DIRECTION_BY_ELEMENT[secondary];

  return {
    recommendedDirections: [
      {
        element: primary,
        direction: primaryMap.direction,
        priority: 1,
        explanation: `当前更适合借助${primary}对应方位做推进。`
      },
      {
        element: secondary,
        direction: secondaryMap.direction,
        priority: 2,
        explanation: `次优方向可参考${secondary}对应方位来增强稳定度。`
      }
    ],
    sceneSuggestions: [
      {
        type: "事业 / 执行",
        scenes: primaryMap.scenes,
        suggestion:
          monthTone === "challenging"
            ? "本阶段更适合先整理资源，再推进结果。"
            : "本阶段适合小步推进，逐渐放大成果。"
      },
      {
        type: "关系 / 社交",
        scenes: secondaryMap.scenes,
        suggestion:
          monthTone === "favorable"
            ? "适合见关键人、沟通立场、推进关系。"
            : "适合先稳定表达，再逐步明确关系边界。"
      }
    ]
  };
}

function buildAiSuggestedQuestions(scope: AdviceScope, categories: ReturnType<typeof buildAuspiciousCategories>) {
  const topThree = categories.slice(0, 3).map((item) => item.label);

  return [
    `结合我的八字，未来7天里哪一天最适合做“${topThree[0]}”？`,
    `如果我最近重点关注事业和决策，哪些日期需要保守一点？`,
    scope === "monthly"
      ? `请按本月节奏，帮我拆解上旬、中旬、下旬的行动重点。`
      : `请结合今天的运势，告诉我更适合主动推进还是先观察。`,
    `我现在更适合见人沟通，还是自己先沉淀整理？`
  ];
}

export function generateQingzhiAdvice(input: QingzhiAdviceInput) {
  const { year, month, day } = parseYmd(input.date);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const bazi = analyzeBazi({
    ...input.profile,
    focusYear: year,
    isVip: true
  });

  const favorableElements = bazi.strengthAnalysis.favorableElements.map((item) => item.name as WuXingName);
  const unfavorableElements = bazi.strengthAnalysis.unfavorableElements.map((item) => item.name as WuXingName);
  const currentLiuNian = bazi.flowAnalysis.supported ? bazi.flowAnalysis.currentLiuNian : null;
  const currentDaYun = bazi.flowAnalysis.supported ? bazi.flowAnalysis.currentDaYun : null;
  const liuYue: Array<{
    monthChinese: string;
    monthOrder: number;
    ganzhi: string;
    xunKong: string | null;
    flowInsight: {
      favorability: FlowTone;
      note: string;
    };
  }> = bazi.flowAnalysis.supported ? (bazi.flowAnalysis.liuYue ?? []) : [];

  const currentMonth = liuYue.find((item) => item.monthOrder === lunar.getMonth()) ?? null;

  const favorableCount =
    (currentLiuNian?.flowInsight.favorability === "favorable" ? 1 : 0) +
    (currentMonth?.flowInsight.favorability === "favorable" ? 1 : 0) +
    (currentDaYun?.flowInsight.favorability === "favorable" ? 1 : 0);
  const challengingCount =
    (currentLiuNian?.flowInsight.favorability === "challenging" ? 1 : 0) +
    (currentMonth?.flowInsight.favorability === "challenging" ? 1 : 0) +
    (currentDaYun?.flowInsight.favorability === "challenging" ? 1 : 0);

  const score = buildScore(favorableCount, challengingCount);
  const topElements = favorableElements.slice(0, 2);
  const styleKeywords = topElements.flatMap((element) => STYLE_BY_ELEMENT[element] ?? []);
  const accessorySuggestions = topElements.flatMap((element) => ACCESSORY_BY_ELEMENT[element] ?? []);
  const sevenDayCalendar = buildSevenDayCalendar(solar, favorableElements, unfavorableElements);
  const auspiciousAdvice = buildAuspiciousAdvice(sevenDayCalendar);
  const directionSceneAdvice = buildDirectionSceneAdvice(
    favorableElements,
    currentMonth?.flowInsight.favorability ?? null
  );

  const badges: AdviceBadge[] = [
    {
      label: "今日节奏",
      value: score >= 80 ? "适合主动推进" : score >= 65 ? "适合稳中求进" : "适合保守观察",
      tone: score >= 80 ? "good" : score >= 65 ? "neutral" : "care"
    },
    {
      label: "喜用方向",
      value: favorableElements.join("、"),
      tone: "good"
    },
    {
      label: "需留意",
      value: unfavorableElements.join("、"),
      tone: "care"
    }
  ];

  return {
    input,
    profileSummary: {
      dayMaster: bazi.dayMaster,
      strength: bazi.strengthAnalysis.levelLabel,
      favorableElements,
      unfavorableElements
    },
    timing: {
      solar: solar.toYmd(),
      lunar: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      week: lunar.getWeekInChinese(),
      jieQi: lunar.getJieQi() || "平节气日",
      yi: normalizeActionList(lunar.getDayYi()),
      ji: normalizeActionList(lunar.getDayJi()),
      currentLiuNian,
      currentMonth
    },
    advice: {
      scope: input.scope,
      score,
      badges,
      summary:
        input.scope === "daily"
          ? `今天整体更适合围绕${favorableElements.join("、")}相关事务发力，避开${unfavorableElements.join("、")}失衡带来的内耗。`
          : `本月建议按“先稳节奏、后做推进”的方式安排事务，重点借助${favorableElements.join("、")}的有利方向。`,
      dailyKeywords:
        input.scope === "daily"
          ? [
              score >= 80 ? "主动" : "稳住",
              favorableElements[0] ?? "平衡",
              currentMonth?.flowInsight.favorability === "challenging" ? "节制" : "推进"
            ]
          : ["布局", "观察", "调节"],
      recommendedColors: pickRecommendedColors(topElements),
      recommendedStyleKeywords: [...new Set(styleKeywords)].slice(0, 4),
      accessorySuggestions: [...new Set(accessorySuggestions)].slice(0, 4),
      dos: DAILY_ACTIONS.good.slice(0, input.scope === "daily" ? 3 : 4),
      donts: DAILY_ACTIONS.care.slice(0, input.scope === "daily" ? 3 : 4),
      relationshipHint:
        bazi.premiumAnalysis.unlocked && bazi.premiumAnalysis.sections.relationship
          ? bazi.premiumAnalysis.sections.relationship.summary
          : "今日关系处理宜先稳定表达，再处理分歧。",
      careerHint:
        bazi.premiumAnalysis.unlocked && bazi.premiumAnalysis.sections.career
          ? bazi.premiumAnalysis.sections.career.summary
          : "事业上宜先看资源承接，再看推进速度。"
    },
    sevenDayCalendar,
    auspiciousAdvice,
    directionSceneAdvice,
    monthlyPanel:
      input.scope === "monthly" && bazi.flowAnalysis.supported
        ? {
            year,
            highlights: buildMonthlyHighlights(
              year,
              liuYue.map((item) => ({
                monthChinese: item.monthChinese,
                flowInsight: {
                  favorability: item.flowInsight.favorability,
                  note: item.flowInsight.note,
                  ganzhi: item.ganzhi
                }
              }))
            )
          }
        : null
  };
}

export function buildQingzhiAdviceAiContext(result: ReturnType<typeof generateQingzhiAdvice>) {
  const categoryBreakdown = [...result.auspiciousAdvice.categoryBreakdown].sort(
    (a, b) => b.bestDay.score - a.bestDay.score
  );

  return {
    module: "qingzhi-advice",
    contextVersion: "v1",
    intent: "用于青筮建议页面右侧 AI 咨询栏，结合用户八字、7天节奏、吉日分类、方向场景建议做个性化追问。",
    summaryCard: {
      scope: result.advice.scope,
      score: result.advice.score,
      summary: result.advice.summary,
      dayMaster: result.profileSummary.dayMaster.label,
      strength: result.profileSummary.strength,
      favorableElements: result.profileSummary.favorableElements,
      unfavorableElements: result.profileSummary.unfavorableElements
    },
    timingContext: {
      solar: result.timing.solar,
      lunar: result.timing.lunar,
      jieQi: result.timing.jieQi,
      currentLiuNian: result.timing.currentLiuNian,
      currentMonth: result.timing.currentMonth
    },
    sevenDayFocus: result.sevenDayCalendar.map((item) => ({
      solar: item.solar,
      week: item.week,
      score: item.score,
      tone: item.tone,
      summary: item.summary,
      topCategories: item.recommendedCategories,
      yi: item.yi,
      ji: item.ji
    })),
    auspiciousCategorySummary: categoryBreakdown.map((item) => ({
      key: item.key,
      label: item.label,
      summary: item.summary,
      bestDay: item.bestDay,
      cautionDay: item.cautionDay
    })),
    directionSceneAdvice: result.directionSceneAdvice,
    styleAdvice: {
      colors: result.advice.recommendedColors,
      styles: result.advice.recommendedStyleKeywords,
      accessories: result.advice.accessorySuggestions
    },
    consultationBoundaries: [
      "优先根据已生成的八字与青筮建议结果回答，不要脱离当前盘面空泛发挥。",
      "如果用户问的是寻物、情感、事业、决断，应优先引用7天日历与吉日分类。",
      "如果遇到健康、法律、医疗、投资等高风险问题，要明确提示仅供参考。"
    ],
    suggestedQuestions: buildAiSuggestedQuestions(result.advice.scope, categoryBreakdown),
    systemPrompt:
      "你是青筮记的 AI 命理咨询助手。请严格基于当前给出的八字摘要、7天节奏、吉日分类、方向/场景建议进行回答。回答风格应具体、温和、可执行，优先给出时间点、适合做什么、为什么、需要避开什么。"
  };
}
