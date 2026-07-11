import { Lunar, LunarYear, Solar } from "lunar-typescript";
import { SHENSHA_CATALOG_BY_NAME } from "./shensha-catalog.js";
import type { CalendarType } from "../../shared/types/domain.js";

type Gender = "male" | "female" | "other";
type WuXingName = "木" | "火" | "土" | "金" | "水";
type StrengthLevel = "strong" | "balanced" | "weak";

type ParsedBirthInput = {
  calendarType: CalendarType;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

type StemOrBranchVisual = {
  value: string;
  wuxing: WuXingName;
  colorName: string;
  colorHex: string;
};

type PillarVisual = {
  name: "year" | "month" | "day" | "hour";
  ganzhi: string;
  heavenlyStem: StemOrBranchVisual;
  earthlyBranch: StemOrBranchVisual;
  hiddenStems: StemOrBranchVisual[];
  wuxing: string;
  naYin: string;
  shiShenStem: string;
  shiShenBranch: string[];
  diShi: string;
  xunKong: string;
};

type WuXingStat = {
  name: WuXingName;
  count: number;
  colorName: string;
  colorHex: string;
};

type FlowElementInsight = {
  ganzhi: string;
  gan: StemOrBranchVisual;
  zhi: StemOrBranchVisual;
  relationToDayMaster: string;
  favorability: "favorable" | "neutral" | "challenging";
  score: number;
  note: string;
};

type PremiumSection = {
  title: string;
  summary: string;
  strengths: string[];
  risks: string[];
  suggestions: string[];
  vipOnly: true;
};

type ChartExplainItem = {
  label: string;
  value: number;
  colorHex: string;
  colorName: string;
  explanation: string;
};

type CompatibilityRelationType =
  | "family"
  | "parent-child"
  | "couple"
  | "same-sex-couple"
  | "colleague"
  | "boss-employee"
  | "partner";

type ShenShaItem = {
  key: string;
  name: string;
  matchedPillars: string[];
  importance: "high" | "medium" | "low";
  tone?: "吉" | "中" | "凶";
  volume?: "common" | "uncommon";
  meaning: string;
  advice: string;
};

const WU_XING_ORDER: WuXingName[] = ["木", "火", "土", "金", "水"];

const WU_XING_COLORS: Record<WuXingName, { colorName: string; colorHex: string }> = {
  木: { colorName: "青绿", colorHex: "#2F9E44" },
  火: { colorName: "朱红", colorHex: "#D94841" },
  土: { colorName: "赭黄", colorHex: "#C27C2C" },
  金: { colorName: "鎏金", colorHex: "#C9A227" },
  水: { colorName: "玄蓝", colorHex: "#2B6CB0" }
};

const GAN_WU_XING: Record<string, WuXingName> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水"
};

const ZHI_WU_XING: Record<string, WuXingName> = {
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

const MONTH_ORDER = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];

function parseBirthInput(
  calendarType: CalendarType,
  birthDate: string,
  birthTime: string
): ParsedBirthInput {
  const dateMatch = birthDate.match(/^(\d{4})-(-?\d{1,2})-(\d{1,2})$/);
  const timeMatch = birthTime.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);

  if (!dateMatch) {
    throw new Error("birthDate must use YYYY-MM-DD");
  }

  if (!timeMatch) {
    throw new Error("birthTime must use HH:mm or HH:mm:ss");
  }

  return {
    calendarType,
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: Number(timeMatch[3] ?? 0)
  };
}

function toVisual(value: string, type: "gan" | "zhi"): StemOrBranchVisual {
  const wuxing = type === "gan" ? GAN_WU_XING[value] : ZHI_WU_XING[value];

  if (!wuxing) {
    throw new Error(`Unsupported ${type} value: ${value}`);
  }

  return {
    value,
    wuxing,
    colorName: WU_XING_COLORS[wuxing].colorName,
    colorHex: WU_XING_COLORS[wuxing].colorHex
  };
}

function getLunarFromInput(input: ParsedBirthInput) {
  if (input.calendarType === "solar") {
    const solar = Solar.fromYmdHms(
      input.year,
      input.month,
      input.day,
      input.hour,
      input.minute,
      input.second
    );
    return { solar, lunar: solar.getLunar() };
  }

  const lunar = Lunar.fromYmdHms(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute,
    input.second
  );

  return { solar: lunar.getSolar(), lunar };
}

function getPillarVisuals(lunar: Lunar) {
  const eightChar = lunar.getEightChar();

  const pillars: PillarVisual[] = [
    {
      name: "year",
      ganzhi: eightChar.getYear(),
      heavenlyStem: toVisual(eightChar.getYearGan(), "gan"),
      earthlyBranch: toVisual(eightChar.getYearZhi(), "zhi"),
      hiddenStems: eightChar.getYearHideGan().map((item) => toVisual(item, "gan")),
      wuxing: eightChar.getYearWuXing(),
      naYin: eightChar.getYearNaYin(),
      shiShenStem: eightChar.getYearShiShenGan(),
      shiShenBranch: eightChar.getYearShiShenZhi(),
      diShi: eightChar.getYearDiShi(),
      xunKong: eightChar.getYearXunKong()
    },
    {
      name: "month",
      ganzhi: eightChar.getMonth(),
      heavenlyStem: toVisual(eightChar.getMonthGan(), "gan"),
      earthlyBranch: toVisual(eightChar.getMonthZhi(), "zhi"),
      hiddenStems: eightChar.getMonthHideGan().map((item) => toVisual(item, "gan")),
      wuxing: eightChar.getMonthWuXing(),
      naYin: eightChar.getMonthNaYin(),
      shiShenStem: eightChar.getMonthShiShenGan(),
      shiShenBranch: eightChar.getMonthShiShenZhi(),
      diShi: eightChar.getMonthDiShi(),
      xunKong: eightChar.getMonthXunKong()
    },
    {
      name: "day",
      ganzhi: eightChar.getDay(),
      heavenlyStem: toVisual(eightChar.getDayGan(), "gan"),
      earthlyBranch: toVisual(eightChar.getDayZhi(), "zhi"),
      hiddenStems: eightChar.getDayHideGan().map((item) => toVisual(item, "gan")),
      wuxing: eightChar.getDayWuXing(),
      naYin: eightChar.getDayNaYin(),
      shiShenStem: eightChar.getDayShiShenGan(),
      shiShenBranch: eightChar.getDayShiShenZhi(),
      diShi: eightChar.getDayDiShi(),
      xunKong: eightChar.getDayXunKong()
    },
    {
      name: "hour",
      ganzhi: eightChar.getTime(),
      heavenlyStem: toVisual(eightChar.getTimeGan(), "gan"),
      earthlyBranch: toVisual(eightChar.getTimeZhi(), "zhi"),
      hiddenStems: eightChar.getTimeHideGan().map((item) => toVisual(item, "gan")),
      wuxing: eightChar.getTimeWuXing(),
      naYin: eightChar.getTimeNaYin(),
      shiShenStem: eightChar.getTimeShiShenGan(),
      shiShenBranch: eightChar.getTimeShiShenZhi(),
      diShi: eightChar.getTimeDiShi(),
      xunKong: eightChar.getTimeXunKong()
    }
  ];

  return { eightChar, pillars };
}

function countWuXing(items: string[]) {
  const counter: Record<WuXingName, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0
  };

  for (const item of items) {
    for (const char of item.split("")) {
      const wuxing = GAN_WU_XING[char] ?? ZHI_WU_XING[char];
      if (wuxing) {
        counter[wuxing] += 1;
      }
    }
  }

  return WU_XING_ORDER.map((name) => ({
    name,
    count: counter[name],
    colorName: WU_XING_COLORS[name].colorName,
    colorHex: WU_XING_COLORS[name].colorHex
  }));
}

function safeCall<T>(callback: () => T, fallback: T | null = null): T | null {
  try {
    return callback();
  } catch {
    return fallback;
  }
}

function generates(element: WuXingName) {
  return WU_XING_ORDER[(WU_XING_ORDER.indexOf(element) + 1) % WU_XING_ORDER.length];
}

function generatedBy(element: WuXingName) {
  return WU_XING_ORDER[(WU_XING_ORDER.indexOf(element) + 4) % WU_XING_ORDER.length];
}

function controls(element: WuXingName) {
  return WU_XING_ORDER[(WU_XING_ORDER.indexOf(element) + 2) % WU_XING_ORDER.length];
}

function controlledBy(element: WuXingName) {
  return WU_XING_ORDER[(WU_XING_ORDER.indexOf(element) + 3) % WU_XING_ORDER.length];
}

function getElementRelation(dayMaster: WuXingName, target: WuXingName) {
  if (target === dayMaster) {
    return "比劫";
  }
  if (target === generatedBy(dayMaster)) {
    return "印星";
  }
  if (target === generates(dayMaster)) {
    return "食伤";
  }
  if (target === controls(dayMaster)) {
    return "财星";
  }
  return "官杀";
}

function getSeasonSupport(monthBranchElement: WuXingName, dayMaster: WuXingName) {
  if (monthBranchElement === dayMaster) {
    return 4;
  }
  if (monthBranchElement === generatedBy(dayMaster)) {
    return 3;
  }
  if (monthBranchElement === generates(dayMaster)) {
    return -1;
  }
  if (monthBranchElement === controls(dayMaster)) {
    return -2;
  }
  return -2;
}

function getStrengthAnalysis(pillars: PillarVisual[]) {
  const dayMaster = pillars[2].heavenlyStem.wuxing;
  const supportiveElements = new Set([dayMaster, generatedBy(dayMaster)]);
  const drainingElements = new Set([generates(dayMaster), controls(dayMaster), controlledBy(dayMaster)]);

  let supportScore = 0;
  let drainScore = 0;

  const addWeighted = (element: WuXingName, weight: number) => {
    if (supportiveElements.has(element)) {
      supportScore += weight;
    } else if (drainingElements.has(element)) {
      drainScore += weight;
    }
  };

  pillars.forEach((pillar, index) => {
    addWeighted(pillar.heavenlyStem.wuxing, index === 2 ? 1.5 : 1);
    addWeighted(pillar.earthlyBranch.wuxing, index === 1 ? 2.5 : 1.25);
    pillar.hiddenStems.forEach((item) => addWeighted(item.wuxing, 0.5));
  });

  supportScore += getSeasonSupport(pillars[1].earthlyBranch.wuxing, dayMaster);

  const delta = supportScore - drainScore;
  const level: StrengthLevel = delta >= 2 ? "strong" : delta <= -1.5 ? "weak" : "balanced";

  const favorableElements =
    level === "strong"
      ? [generates(dayMaster), controls(dayMaster), controlledBy(dayMaster)]
      : level === "weak"
        ? [dayMaster, generatedBy(dayMaster)]
        : [generatedBy(dayMaster), controls(dayMaster)];

  const unfavorableElements =
    level === "strong"
      ? [dayMaster, generatedBy(dayMaster)]
      : level === "weak"
        ? [generates(dayMaster), controls(dayMaster), controlledBy(dayMaster)]
        : [dayMaster];

  return {
    dayMaster,
    supportScore: Number(supportScore.toFixed(2)),
    drainScore: Number(drainScore.toFixed(2)),
    delta: Number(delta.toFixed(2)),
    level,
    levelLabel:
      level === "strong" ? "日主偏旺" : level === "weak" ? "日主偏弱" : "日主中和偏平",
    favorableElements,
    unfavorableElements,
    reasoning: buildStrengthReasoning(level, dayMaster, pillars)
  };
}

function buildStrengthReasoning(
  level: StrengthLevel,
  dayMaster: WuXingName,
  pillars: PillarVisual[]
) {
  const monthBranch = pillars[1].earthlyBranch;
  const base = `日主为${dayMaster}，月令落在${pillars[1].ganzhi}，月支${monthBranch.value}属${monthBranch.wuxing}。`;

  if (level === "strong") {
    return `${base} 同类与生扶之气偏足，首版判断为日主偏旺，喜泄耗制衡。`;
  }

  if (level === "weak") {
    return `${base} 生扶根气相对不足，首版判断为日主偏弱，宜先扶助日主与印比。`;
  }

  return `${base} 生扶与耗泄力量接近，首版判断为中和偏平，可再结合大运流年细看。`;
}

function toElementVisualList(elements: WuXingName[]) {
  return elements.map((item) => ({
    name: item,
    colorName: WU_XING_COLORS[item].colorName,
    colorHex: WU_XING_COLORS[item].colorHex,
    relation: item
  }));
}

function toDisplayAge(year: number, birthYear: number) {
  return Math.max(0, year - birthYear);
}

const FLOW_MONTH_SOLAR_TERMS = [
  "\u7acb\u6625",
  "\u60ca\u86f0",
  "\u6e05\u660e",
  "\u7acb\u590f",
  "\u8292\u79cd",
  "\u5c0f\u6691",
  "\u7acb\u79cb",
  "\u767d\u9732",
  "\u5bd2\u9732",
  "\u7acb\u51ac",
  "\u5927\u96ea",
  "\u5c0f\u5bd2"
] as const;

function getFlowMonthSolarTermMeta(year: number, index: number) {
  const solarTerm = FLOW_MONTH_SOLAR_TERMS[index] ?? "";
  const table = Solar.fromYmd(year, 1, 1).getLunar().getJieQiTable();
  const solar = solarTerm ? table[solarTerm] : null;
  return {
    solarTerm,
    solarDateLabel: solar ? `${solar.getMonth()}/${solar.getDay()}` : "—"
  };
}

function getDaYunSummary(
  lunar: Lunar,
  gender: Gender,
  favorableElements: WuXingName[] = [],
  unfavorableElements: WuXingName[] = []
) {
  if (gender === "other") {
    return {
      supported: false,
      note: "当前大运顺逆排法首版仅按男/女传统规则输出。"
    };
  }

  const yun = lunar.getEightChar().getYun(gender === "male" ? 1 : 0);
  const birthYear = lunar.getSolar().getYear();
  const dayMaster = GAN_WU_XING[lunar.getEightChar().getDayGan()];
  const daYun = yun
    .getDaYun(11)
    .map((item) => ({
      index: item.getIndex(),
      ganzhi: item.getGanZhi(),
      startYear: item.getStartYear(),
      endYear: item.getEndYear(),
      startAge: toDisplayAge(item.getStartYear(), birthYear),
      endAge: toDisplayAge(item.getEndYear(), birthYear),
      flowInsight: item.getGanZhi()
        ? buildFlowInsight(item.getGanZhi(), dayMaster, favorableElements, unfavorableElements)
        : undefined,
      xunKong: safeCall(() => item.getXunKong())
    }))
    .filter((item) => item.ganzhi);

  return {
    supported: true,
    isForward: yun.isForward(),
    startOffset: {
      year: yun.getStartYear(),
      month: yun.getStartMonth(),
      day: yun.getStartDay(),
      hour: yun.getStartHour()
    },
    startSolarDate: yun.getStartSolar().toYmdHms(),
    daYun
  };
}

function buildFlowInsight(
  ganzhi: string,
  dayMaster: WuXingName,
  favorableElements: WuXingName[],
  unfavorableElements: WuXingName[]
): FlowElementInsight {
  const gan = toVisual(ganzhi[0], "gan");
  const zhi = toVisual(ganzhi[1], "zhi");
  const ganRelation = getElementRelation(dayMaster, gan.wuxing);
  const zhiRelation = getElementRelation(dayMaster, zhi.wuxing);
  const relation = `${ganRelation} / ${zhiRelation}`;
  const elementWeight = (element: WuXingName, weight: number) =>
    (favorableElements.includes(element) ? weight : 0) -
    (unfavorableElements.includes(element) ? weight : 0);
  const relationWeight = (value: string) => {
    if (value.includes("印")) return 1.35;
    if (value.includes("比")) return 1.1;
    if (value.includes("食") || value.includes("伤")) return 0.95;
    if (value.includes("财")) return 0.9;
    if (value.includes("官") || value.includes("杀")) return 0.85;
    return 1;
  };
  const score = Number(
    (
      elementWeight(gan.wuxing, 1.25) * relationWeight(ganRelation) +
      elementWeight(zhi.wuxing, 1.1) * relationWeight(zhiRelation)
    ).toFixed(2)
  );

  const favorability: "favorable" | "neutral" | "challenging" =
    score >= 1.15 ? "favorable" : score <= -1.05 ? "challenging" : "neutral";

  return {
    ganzhi,
    gan,
    zhi,
    relationToDayMaster: relation,
    score,
    favorability,
    note:
      favorability === "favorable"
        ? "该干支组合更接近当前命局所喜，适合顺势推进。"
        : favorability === "challenging"
          ? "该干支组合对日主形成一定耗泄或压力，宜稳中求进。"
          : "该干支组合对命局影响中性，需结合具体事项判断。"
  };
}

function getCurrentDaYunDetail(
  lunar: Lunar,
  gender: Gender,
  focusYear: number,
  favorableElements: WuXingName[],
  unfavorableElements: WuXingName[]
) {
  if (gender === "other") {
    return {
      supported: false,
      note: "当前流年流月联动分析首版暂按男/女传统大运规则输出。"
    };
  }

  const yun = lunar.getEightChar().getYun(gender === "male" ? 1 : 0);
  const dayMaster = GAN_WU_XING[lunar.getEightChar().getDayGan()];
  const birthYear = lunar.getSolar().getYear();
  const daYunList = yun
    .getDaYun(11)
    .filter((item) => item.getGanZhi())
    .map((item) => ({
      index: item.getIndex(),
      ganzhi: item.getGanZhi(),
      startYear: item.getStartYear(),
      endYear: item.getEndYear(),
      startAge: toDisplayAge(item.getStartYear(), birthYear),
      endAge: toDisplayAge(item.getEndYear(), birthYear),
      flowInsight: buildFlowInsight(item.getGanZhi(), dayMaster, favorableElements, unfavorableElements),
      raw: item
    }));

  const currentDaYun = daYunList.find((item) => focusYear >= item.startYear && focusYear <= item.endYear) ?? daYunList[0];
  const liuNian = currentDaYun.raw
    .getLiuNian()
    .map((item) => ({
      year: item.getYear(),
      age: toDisplayAge(item.getYear(), birthYear),
      ganzhi: item.getGanZhi(),
      xunKong: safeCall(() => item.getXunKong()),
      flowInsight: buildFlowInsight(item.getGanZhi(), dayMaster, favorableElements, unfavorableElements),
      raw: item
    }));

  const currentLiuNian =
    liuNian.find((item) => item.year === focusYear) ??
    liuNian.reduce((closest, item) =>
      Math.abs(item.year - focusYear) < Math.abs(closest.year - focusYear) ? item : closest
    );

  const liuYue = currentLiuNian.raw.getLiuYue().map((item) => ({
    monthChinese: item.getMonthInChinese(),
    monthOrder: MONTH_ORDER.indexOf(item.getMonthInChinese()) + 1,
    ganzhi: item.getGanZhi(),
    xunKong: safeCall(() => item.getXunKong()),
    flowInsight: buildFlowInsight(item.getGanZhi(), dayMaster, favorableElements, unfavorableElements),
    shenShaAnalysis: buildFlowShenShaAnalysis(item.getGanZhi(), "流月", {
      yearStem: lunar.getEightChar().getYearGan(),
      yearBranch: lunar.getEightChar().getYearZhi(),
      monthBranch: lunar.getEightChar().getMonthZhi(),
      dayStem: lunar.getEightChar().getDayGan(),
      dayBranch: lunar.getEightChar().getDayZhi(),
      yearNaYin: lunar.getEightChar().getYearNaYin(),
      dayNaYin: lunar.getEightChar().getDayNaYin(),
      gender
    })
  }));

  const liuYueWithSolar = liuYue.map((item, index) => ({
    ...item,
    ...getFlowMonthSolarTermMeta(currentLiuNian.year, index)
  }));

  const natalContext = {
    yearStem: lunar.getEightChar().getYearGan(),
    yearBranch: lunar.getEightChar().getYearZhi(),
    monthBranch: lunar.getEightChar().getMonthZhi(),
    dayStem: lunar.getEightChar().getDayGan(),
    dayBranch: lunar.getEightChar().getDayZhi(),
    yearNaYin: lunar.getEightChar().getYearNaYin(),
    dayNaYin: lunar.getEightChar().getDayNaYin(),
    gender
  };
  const currentDaYunShenSha = buildFlowShenShaAnalysis(currentDaYun.ganzhi, "大运", natalContext);
  const currentLiuNianShenSha = buildFlowShenShaAnalysis(currentLiuNian.ganzhi, "流年", natalContext);

  return {
    supported: true,
    focusYear,
    currentDaYun: {
      index: currentDaYun.index,
      ganzhi: currentDaYun.ganzhi,
      startYear: currentDaYun.startYear,
      endYear: currentDaYun.endYear,
      startAge: currentDaYun.startAge,
      endAge: currentDaYun.endAge,
      flowInsight: currentDaYun.flowInsight,
      shenShaAnalysis: currentDaYunShenSha
    },
    currentLiuNian: {
      year: currentLiuNian.year,
      age: currentLiuNian.age,
      ganzhi: currentLiuNian.ganzhi,
      xunKong: currentLiuNian.xunKong,
      flowInsight: currentLiuNian.flowInsight,
      shenShaAnalysis: currentLiuNianShenSha
    },
    liuNianTimeline: liuNian.map((item) => ({
      year: item.year,
      age: item.age,
      ganzhi: item.ganzhi,
      xunKong: item.xunKong,
      flowInsight: item.flowInsight,
      shenShaAnalysis: buildFlowShenShaAnalysis(item.ganzhi, "流年", natalContext)
    })),
    liuYue: liuYueWithSolar
  };
}

function buildWuXingBalanceHint(stats: WuXingStat[]) {
  const sorted = [...stats].sort((a, b) => b.count - a.count);
  const max = sorted[0];
  const min = sorted[sorted.length - 1];

  if (max.count === min.count) {
    return "当前八字五行分布较平均，可继续结合月令、藏干和大运细看旺衰。";
  }

  return `当前盘面${max.name}偏旺、${min.name}偏弱，首版建议继续结合月令与大运判断喜忌。`;
}

function pickPillarHits(
  pillars: PillarVisual[],
  targetBranches: string[],
  targetStems: string[] = []
) {
  return pillars
    .filter(
      (pillar) =>
        targetBranches.includes(pillar.earthlyBranch.value) ||
        targetStems.includes(pillar.heavenlyStem.value)
    )
    .map((pillar) =>
      pillar.name === "year"
        ? "年柱"
        : pillar.name === "month"
          ? "月柱"
          : pillar.name === "day"
            ? "日柱"
            : "时柱"
    );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function splitMixedTargets(targets: string[]) {
  const stems = uniqueStrings(targets.filter((target) => !!GAN_WU_XING[target]));
  const branches = uniqueStrings(targets.filter((target) => !!ZHI_WU_XING[target]));
  return { stems, branches };
}

function pickPillarHitsByGanzhi(pillars: PillarVisual[], targetGanzhi: string[]) {
  return pillars
    .filter((pillar) => targetGanzhi.includes(pillar.ganzhi))
    .map((pillar) =>
      pillar.name === "year"
        ? "年柱"
        : pillar.name === "month"
          ? "月柱"
          : pillar.name === "day"
            ? "日柱"
            : "时柱"
    );
}

function getNaYinElement(naYin: string) {
  const lastChar = naYin.slice(-1);
  return ["金", "木", "水", "火", "土"].includes(lastChar) ? lastChar : "";
}

function isYangStem(stem: string) {
  return ["甲", "丙", "戊", "庚", "壬"].includes(stem);
}

function branchGroup(branch: string) {
  if (["申", "子", "辰"].includes(branch)) {
    return "water";
  }
  if (["寅", "午", "戌"].includes(branch)) {
    return "fire";
  }
  if (["亥", "卯", "未"].includes(branch)) {
    return "wood";
  }
  return "metal";
}

function getGroupTarget(
  branch: string,
  mapping: Record<"water" | "fire" | "wood" | "metal", string>
) {
  return mapping[branchGroup(branch)];
}

function pushShenShaIfHit(
  items: ShenShaItem[],
  pillars: PillarVisual[],
  config: {
    key: string;
    name: string;
    branches?: string[];
    stems?: string[];
    importance: "high" | "medium" | "low";
    meaning: string;
    advice: string;
  }
) {
  const hits = pickPillarHits(pillars, config.branches ?? [], config.stems ?? []);
  if (!hits.length) {
    return;
  }

  const catalogMeta = SHENSHA_CATALOG_BY_NAME.get(config.name);

  items.push({
    key: config.key,
    name: config.name,
    matchedPillars: hits,
    importance: config.importance,
    tone: catalogMeta?.tone ?? "中",
    volume: catalogMeta?.volume ?? "common",
    meaning: config.meaning,
    advice: config.advice
  });
}

function pushFlowShenShaIfHit(
  items: ShenShaItem[],
  flowLabel: string,
  flowGanzhi: string,
  config: {
    key: string;
    name: string;
    branches?: string[];
    stems?: string[];
    ganzhis?: string[];
    importance: "high" | "medium" | "low";
    meaning: string;
    advice: string;
  }
) {
  const gan = flowGanzhi?.[0] || "";
  const zhi = flowGanzhi?.[1] || "";
  const hit =
    uniqueStrings(config.ganzhis ?? []).includes(flowGanzhi) ||
    uniqueStrings(config.branches ?? []).includes(zhi) ||
    uniqueStrings(config.stems ?? []).includes(gan);

  if (!hit) {
    return;
  }

  const catalogMeta = SHENSHA_CATALOG_BY_NAME.get(config.name);
  items.push({
    key: config.key,
    name: config.name,
    matchedPillars: [flowLabel],
    importance: config.importance,
    tone: catalogMeta?.tone ?? "中",
    volume: catalogMeta?.volume ?? "common",
    meaning: config.meaning,
    advice: config.advice
  });
}

function buildFlowShenShaAnalysis(
  flowGanzhi: string,
  flowLabel: string,
  context: {
    yearStem: string;
    yearBranch: string;
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    yearNaYin: string;
    dayNaYin: string;
    gender: Gender;
  }
) {
  const items: ShenShaItem[] = [];
  const yearStem = context.yearStem;
  const yearBranch = context.yearBranch;
  const monthBranch = context.monthBranch;
  const dayStem = context.dayStem;
  const dayBranch = context.dayBranch;

  const tianYiMap: Record<string, string[]> = {
    甲: ["丑", "未"],
    戊: ["丑", "未"],
    庚: ["丑", "未"],
    乙: ["子", "申"],
    己: ["子", "申"],
    丙: ["亥", "酉"],
    丁: ["亥", "酉"],
    壬: ["巳", "卯"],
    癸: ["巳", "卯"],
    辛: ["寅", "午"]
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "tianyi",
    name: "天乙贵人",
    branches: uniqueStrings([...(tianYiMap[yearStem] ?? []), ...(tianYiMap[dayStem] ?? [])]),
    importance: "high",
    meaning: "关键阶段较容易遇到帮助、提携、转圜空间。",
    advice: "遇事不要只靠硬扛，主动借力、找贵人、找专业协助会更顺。"
  });

  const taiJiMap: Record<string, string[]> = {
    甲: ["子", "午"],
    乙: ["子", "午"],
    丙: ["卯", "酉"],
    丁: ["卯", "酉"],
    戊: ["辰", "戌", "丑", "未"],
    己: ["辰", "戌", "丑", "未"],
    庚: ["寅", "亥"],
    辛: ["寅", "亥"],
    壬: ["巳", "申"],
    癸: ["巳", "申"]
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "taiji",
    name: "太极贵人",
    branches: uniqueStrings([...(taiJiMap[yearStem] ?? []), ...(taiJiMap[dayStem] ?? [])]),
    importance: "medium",
    meaning: "悟性、思考深度、对玄学哲学规律性的感应更强。",
    advice: "适合研究、策划、咨询、命理心理等深思型方向。"
  });

  const wenChangMap: Record<string, string> = {
    甲: "巳",
    乙: "午",
    丙: "申",
    丁: "酉",
    戊: "申",
    己: "酉",
    庚: "亥",
    辛: "子",
    壬: "寅",
    癸: "卯"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "wenchang",
    name: "文昌贵人",
    branches: uniqueStrings([wenChangMap[yearStem], wenChangMap[dayStem]]),
    importance: "medium",
    meaning: "学习、理解结构、考试写作、表达组织力较强。",
    advice: "适合做内容、学习、策划、考证和系统型成长。"
  });

  const tianDeMap: Record<string, string> = {
    寅: "丁",
    卯: "申",
    辰: "壬",
    巳: "辛",
    午: "亥",
    未: "甲",
    申: "癸",
    酉: "寅",
    戌: "丙",
    亥: "乙",
    子: "巳",
    丑: "庚"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "tiande",
    name: "天德贵人",
    stems: [tianDeMap[monthBranch]],
    branches: [tianDeMap[monthBranch]],
    importance: "medium",
    meaning: "以月令所主天德查四柱，重在减损化缓、守正得护。",
    advice: "越是复杂局面，越适合走正路、留余地、做修补动作。"
  });

  const yueDeMap: Record<string, string> = {
    寅: "丙",
    午: "丙",
    戌: "丙",
    申: "壬",
    子: "壬",
    辰: "壬",
    亥: "甲",
    卯: "甲",
    未: "甲",
    巳: "庚",
    酉: "庚",
    丑: "庚"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "yuede",
    name: "月德贵人",
    stems: [yueDeMap[monthBranch]],
    branches: [yueDeMap[monthBranch]],
    importance: "medium",
    meaning: "月德主温和转圜、人情缓冲与协商空间。",
    advice: "适合在冲突、协商、办手续和求人助力时主动用柔和方式推进。"
  });

  const tianDeHeMap: Record<string, string> = {
    寅: "壬",
    卯: "寅",
    辰: "丁",
    巳: "丙",
    午: "寅",
    未: "己",
    申: "戊",
    酉: "亥",
    戌: "辛",
    亥: "庚",
    子: "申",
    丑: "乙"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "tiandehe",
    name: "天德合",
    stems: [tianDeHeMap[monthBranch]],
    branches: [tianDeHeMap[monthBranch]],
    importance: "medium",
    meaning: "天德合偏重和合修补，利关系润滑、谈判缓冲、误会化解。",
    advice: "适合做和解、收尾、修复关系和补缺动作。"
  });

  const yueDeHeMap: Record<string, string> = {
    寅: "辛",
    午: "辛",
    戌: "辛",
    申: "丁",
    子: "丁",
    辰: "丁",
    亥: "己",
    卯: "己",
    未: "己",
    巳: "乙",
    酉: "乙",
    丑: "乙"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "yuedehe",
    name: "月德合",
    stems: [yueDeHeMap[monthBranch]],
    branches: [yueDeHeMap[monthBranch]],
    importance: "medium",
    meaning: "月德合更强调和气与修补。",
    advice: "适合关系修复、谈合作与做收口动作。"
  });

  const taoHuaMap: Record<string, string> = {
    寅: "卯",
    午: "卯",
    戌: "卯",
    申: "酉",
    子: "酉",
    辰: "酉",
    巳: "午",
    酉: "午",
    丑: "午",
    亥: "子",
    卯: "子",
    未: "子"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "taohua",
    name: "桃花",
    branches: uniqueStrings([taoHuaMap[yearBranch], taoHuaMap[dayBranch]]),
    importance: "medium",
    meaning: "人缘、感情吸引力、社交热度较容易被放大。",
    advice: "有利于关系与曝光，但也要防情绪牵动与边界不清。"
  });
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "xianchi",
    name: "咸池",
    branches: uniqueStrings([taoHuaMap[yearBranch], taoHuaMap[dayBranch]]),
    importance: "medium",
    meaning: "年支日支并参的情感欲念之星，既主魅力流动，也主关系边界与情绪牵引。",
    advice: "利社交、桃花和曝光，但涉及暧昧关系、应酬和情绪消费时更要守住分寸。"
  });

  const yiMaMap: Record<string, string> = {
    寅: "申",
    午: "申",
    戌: "申",
    申: "寅",
    子: "寅",
    辰: "寅",
    巳: "亥",
    酉: "亥",
    丑: "亥",
    亥: "巳",
    卯: "巳",
    未: "巳"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "yima",
    name: "驿马",
    branches: uniqueStrings([yiMaMap[yearBranch], yiMaMap[dayBranch]]),
    importance: "medium",
    meaning: "变动、迁移、奔波、跨环境切换更明显。",
    advice: "适合异地、差旅、转岗与资源流动，但稳定度要额外经营。"
  });

  const huaGaiMap: Record<string, string> = {
    water: "辰",
    fire: "戌",
    wood: "未",
    metal: "丑"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "huagai",
    name: "华盖",
    branches: uniqueStrings([huaGaiMap[branchGroup(yearBranch)], huaGaiMap[branchGroup(dayBranch)]]),
    importance: "medium",
    meaning: "思辨、审美、精神世界与独处感较强。",
    advice: "适合研究、创作、玄学美学类方向，但要防过度封闭。"
  });

  const jiangXingMap: Record<string, string> = {
    water: "子",
    fire: "午",
    wood: "卯",
    metal: "酉"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "jiangxing",
    name: "将星",
    branches: uniqueStrings([jiangXingMap[branchGroup(yearBranch)], jiangXingMap[branchGroup(dayBranch)]]),
    importance: "high",
    meaning: "主导意识、带头能力、掌控场域倾向更明显。",
    advice: "适合做核心决策和负责人，但也要避免太强势。"
  });

  const luShenMap: Record<string, string> = {
    甲: "寅",
    乙: "卯",
    丙: "巳",
    丁: "午",
    戊: "巳",
    己: "午",
    庚: "申",
    辛: "酉",
    壬: "亥",
    癸: "子"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "lushen",
    name: "禄神",
    branches: [luShenMap[dayStem]],
    importance: "high",
    meaning: "个人资源、自我驱动力与现实获取能力较容易被看见。",
    advice: "适合靠专业、能力和持续输出换成果。"
  });

  const yangRenMap: Record<string, string> = {
    甲: "卯",
    乙: "寅",
    丙: "午",
    丁: "巳",
    戊: "午",
    己: "巳",
    庚: "酉",
    辛: "申",
    壬: "子",
    癸: "亥"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "yangren",
    name: "羊刃",
    branches: [yangRenMap[dayStem]],
    importance: "high",
    meaning: "行动力、冲劲、锋芒与对抗性被放大。",
    advice: "适合高执行和强决断场景，但关系里要防急躁。"
  });

  const feiRenMap: Record<string, string> = {
    甲: "酉",
    乙: "申",
    丙: "子",
    丁: "亥",
    戊: "子",
    己: "亥",
    庚: "卯",
    辛: "寅",
    壬: "午",
    癸: "巳"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "feiren",
    name: "飞刃",
    branches: [feiRenMap[dayStem]],
    importance: "high",
    meaning: "以日干对冲羊刃之地，主突发锋芒、冲撞、突发性耗损。",
    advice: "适合快节奏破局，但一定要防口舌升级、操作冒进。"
  });

  const xueRenMap: Record<string, string> = {
    甲: "卯",
    乙: "辰",
    丙: "午",
    丁: "未",
    戊: "午",
    己: "未",
    庚: "酉",
    辛: "戌",
    壬: "子",
    癸: "丑"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "xueren",
    name: "血刃",
    branches: [xueRenMap[dayStem]],
    importance: "medium",
    meaning: "主血光损伤、手术创口、激烈碰撞与急性耗损风险。",
    advice: "行运再冲时更要注意驾驶、金属、运动、炎症与冲动型对抗。"
  });

  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "jinshen",
    name: "金神",
    ganzhis: ["乙丑", "己巳", "癸酉"],
    importance: "medium",
    meaning: "主刚烈、果断、极端执行与强烈斩断力。",
    advice: "适合做决断型事务，但一定要给自己留复盘和缓冲机制。"
  });

  const sixXiuSet = new Set(["丙午", "丁未", "戊子", "戊午", "己丑", "己未"]);
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "liuxiuri",
    name: "六秀日",
    ganzhis: [...sixXiuSet],
    importance: "low",
    meaning: "主秀气、审美、细腻表达与文艺气质。",
    advice: "适合把气质、表达、设计、内容和审美做成个人优势。"
  });

  const baZhuanSet = new Set(["甲寅", "乙卯", "戊辰", "己未", "庚申", "辛酉", "壬子", "癸亥", "丁未", "戊戌"]);
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "bazhuan",
    name: "八专",
    ganzhis: [...baZhuanSet],
    importance: "medium",
    meaning: "八专以日柱本气全合为主，主专一、执着、偏锋感。",
    advice: "适合把专注力转成专业优势，但关系和合作里要防过度执拗。"
  });

  const jiuChouSet = new Set(["壬子", "壬午", "戊子", "戊午", "己卯", "己酉", "乙卯", "乙酉", "辛卯", "辛酉"]);
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "jiuchou",
    name: "九丑",
    ganzhis: [...jiuChouSet],
    importance: "low",
    meaning: "九丑日主感情、名誉、欲望与人际边界更易形成纠缠。",
    advice: "涉及感情、酒色、口舌和公众评价时，更要慢一点、稳一点。"
  });

  const hongLuanMap: Record<string, string> = {
    子: "卯",
    丑: "寅",
    寅: "丑",
    卯: "子",
    辰: "亥",
    巳: "戌",
    午: "酉",
    未: "申",
    申: "未",
    酉: "午",
    戌: "巳",
    亥: "辰"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "hongluan",
    name: "红鸾",
    branches: [hongLuanMap[yearBranch]],
    importance: "medium",
    meaning: "感情、人缘、喜庆联结更容易被点亮。",
    advice: "对感情与关系修复有加成，但仍要结合流运看时机。"
  });

  const tianXiMap: Record<string, string> = {
    子: "酉",
    丑: "申",
    寅: "未",
    卯: "午",
    辰: "巳",
    巳: "辰",
    午: "卯",
    未: "寅",
    申: "丑",
    酉: "子",
    戌: "亥",
    亥: "戌"
  };
  pushFlowShenShaIfHit(items, flowLabel, flowGanzhi, {
    key: "tianxi",
    name: "天喜",
    branches: [tianXiMap[yearBranch]],
    importance: "medium",
    meaning: "喜庆、人缘活络、关系转暖的信号较明显。",
    advice: "适合关系破冰、沟通修复、喜庆事项推进。"
  });

  if (["壬子", "壬午", "戊子", "戊午", "己卯", "己酉", "乙卯", "乙酉", "辛卯", "辛酉"].includes(flowGanzhi)) {
    items.push({
      key: "jiuchou",
      name: "九丑",
      matchedPillars: [flowLabel],
      importance: "low",
      tone: SHENSHA_CATALOG_BY_NAME.get("九丑")?.tone ?? "凶",
      volume: SHENSHA_CATALOG_BY_NAME.get("九丑")?.volume ?? "common",
      meaning: "九丑日主感情、名誉、欲望与人际边界更易形成纠缠，往往要靠节制与分寸化解。",
      advice: "涉及感情、酒色、口舌和公众评价时，更要慢一点、稳一点、少做高风险选择。"
    });
  }

  const uniqueItems = new Map<string, ShenShaItem>();
  for (const item of items) {
    if (!uniqueItems.has(item.key)) {
      uniqueItems.set(item.key, item);
      continue;
    }
    const current = uniqueItems.get(item.key)!;
    uniqueItems.set(item.key, {
      ...current,
      matchedPillars: [...new Set([...current.matchedPillars, ...item.matchedPillars])]
    });
  }

  const finalItems = [...uniqueItems.values()].map((item) => {
    const catalogMeta = SHENSHA_CATALOG_BY_NAME.get(item.name);
    return {
      ...item,
      tone: catalogMeta?.tone ?? item.tone ?? "中",
      volume: catalogMeta?.volume ?? item.volume ?? "common",
      meaning: item.meaning || catalogMeta?.shortNote || "",
      advice: item.advice || catalogMeta?.fullNote || ""
    };
  });

  const commonItems = finalItems.filter((item) => item.volume === "common");
  const uncommonItems = finalItems.filter((item) => item.volume === "uncommon");

  return {
    items: finalItems,
    commonItems,
    uncommonItems
  };
}

function buildShenShaAnalysis(pillars: PillarVisual[], gender: Gender) {
  const yearStem = pillars[0].heavenlyStem.value;
  const yearBranch = pillars[0].earthlyBranch.value;
  const dayNaYin = pillars[2].naYin;
  const yearNaYin = pillars[0].naYin;
  const dayBranch = pillars[2].earthlyBranch.value;
  const dayStem = pillars[2].heavenlyStem.value;
  const dayPillar = pillars[2].ganzhi;
  const monthBranch = pillars[1].earthlyBranch.value;
  const items: ShenShaItem[] = [];

  const taoHuaTargets = uniqueStrings(
    [yearBranch, dayBranch].map((branch) =>
      getGroupTarget(branch, {
        water: "酉",
        fire: "卯",
        wood: "子",
        metal: "午"
      })
    )
  );
  const taoHuaHits = pickPillarHits(pillars, taoHuaTargets);
  if (taoHuaHits.length > 0) {
    items.push({
      key: "taohua",
      name: "桃花",
      matchedPillars: taoHuaHits,
      importance: "high",
      meaning: "人缘、情感吸引力、社交热度较容易被放大。",
      advice: "有利于关系与曝光，但也要防情绪牵动与边界不清。"
    });
  }

  if (taoHuaHits.length > 0) {
    items.push({
      key: "xianchi",
      name: "咸池",
      matchedPillars: taoHuaHits,
      importance: "medium",
      meaning: "年支日支并参的情感欲念之星，既主魅力流动，也主关系边界与情绪牵引。",
      advice: "利社交、桃花和曝光，但涉及暧昧关系、应酬和情绪消费时更要守住分寸。"
    });
  }

  const yiMaTargets = uniqueStrings(
    [yearBranch, dayBranch].map((branch) =>
      getGroupTarget(branch, {
        water: "寅",
        fire: "申",
        wood: "巳",
        metal: "亥"
      })
    )
  );
  const yiMaHits = pickPillarHits(pillars, yiMaTargets);
  if (yiMaHits.length > 0) {
    items.push({
      key: "yima",
      name: "驿马",
      matchedPillars: yiMaHits,
      importance: "medium",
      meaning: "变动、迁移、奔波、跨环境切换更明显。",
      advice: "适合异地、差旅、转岗与资源流动，但稳定度要额外经营。"
    });
  }

  const huaGaiTargets = uniqueStrings(
    [yearBranch, dayBranch].map((branch) =>
      getGroupTarget(branch, {
        water: "辰",
        fire: "戌",
        wood: "未",
        metal: "丑"
      })
    )
  );
  const huaGaiHits = pickPillarHits(pillars, huaGaiTargets);
  if (huaGaiHits.length > 0) {
    items.push({
      key: "huagai",
      name: "华盖",
      matchedPillars: huaGaiHits,
      importance: "medium",
      meaning: "思辨、审美、精神世界与独处感较强。",
      advice: "适合研究、创作、玄学美学类方向，但要防过度封闭。"
    });
  }

  const jiangXingTargets = uniqueStrings(
    [yearBranch, dayBranch].map((branch) =>
      getGroupTarget(branch, {
        water: "子",
        fire: "午",
        wood: "卯",
        metal: "酉"
      })
    )
  );
  const jiangXingHits = pickPillarHits(pillars, jiangXingTargets);
  if (jiangXingHits.length > 0) {
    items.push({
      key: "jiangxing",
      name: "将星",
      matchedPillars: jiangXingHits,
      importance: "high",
      meaning: "主导意识、带头能力、掌控场域倾向更明显。",
      advice: "适合做核心决策和负责人，但也要避免太强势。"
    });
  }

  const wenChangMap: Record<string, string> = {
    甲: "巳",
    乙: "午",
    丙: "申",
    丁: "酉",
    戊: "申",
    己: "酉",
    庚: "亥",
    辛: "子",
    壬: "寅",
    癸: "卯"
  };
  const wenChangHits = pickPillarHits(
    pillars,
    uniqueStrings([wenChangMap[yearStem], wenChangMap[dayStem]])
  );
  if (wenChangHits.length > 0) {
    items.push({
      key: "wenchang",
      name: "文昌贵人",
      matchedPillars: wenChangHits,
      importance: "medium",
      meaning: "学习、理解结构、考试写作、表达组织力较强。",
      advice: "适合做内容、学习、策划、考证和系统型成长。"
    });
  }

  const tianYiMap: Record<string, string[]> = {
    甲: ["丑", "未"],
    戊: ["丑", "未"],
    庚: ["丑", "未"],
    乙: ["子", "申"],
    己: ["子", "申"],
    丙: ["亥", "酉"],
    丁: ["亥", "酉"],
    壬: ["巳", "卯"],
    癸: ["巳", "卯"],
    辛: ["寅", "午"]
  };
  const tianYiHits = pickPillarHits(
    pillars,
    uniqueStrings([...(tianYiMap[yearStem] ?? []), ...(tianYiMap[dayStem] ?? [])])
  );
  if (tianYiHits.length > 0) {
    items.push({
      key: "tianyi",
      name: "天乙贵人",
      matchedPillars: tianYiHits,
      importance: "high",
      meaning: "关键阶段较容易遇到帮助、提携、转圜空间。",
      advice: "遇事不要只靠硬扛，主动借力、找贵人、找专业协助会更顺。"
    });
  }

  if (new Set(["庚辰", "庚戌", "壬辰", "戊戌"]).has(dayPillar)) {
    items.push({
      key: "kuigang",
      name: "魁罡",
      matchedPillars: ["日柱"],
      importance: "high",
      meaning: "个性锋利、标准感强、执行果断，带有不愿被轻易拿捏的特征。",
      advice: "适合高压和决断场景，但关系里尤其要注意柔软度与留余地。"
    });
  }

  const hongLuanMap: Record<string, string> = {
    子: "卯",
    丑: "寅",
    寅: "丑",
    卯: "子",
    辰: "亥",
    巳: "戌",
    午: "酉",
    未: "申",
    申: "未",
    酉: "午",
    戌: "巳",
    亥: "辰"
  };
  const hongLuanHits = pickPillarHits(pillars, [hongLuanMap[yearBranch]]);
  if (hongLuanHits.length > 0) {
    items.push({
      key: "hongluan",
      name: "红鸾",
      matchedPillars: hongLuanHits,
      importance: "medium",
      meaning: "感情、人缘、喜庆联结更容易被点亮。",
      advice: "对感情与关系修复有加成，但仍要结合流运看时机。"
    });
  }

  const tianXiMap: Record<string, string> = {
    子: "酉",
    丑: "申",
    寅: "未",
    卯: "午",
    辰: "巳",
    巳: "辰",
    午: "卯",
    未: "寅",
    申: "丑",
    酉: "子",
    戌: "亥",
    亥: "戌"
  };
  const tianXiHits = pickPillarHits(pillars, [tianXiMap[yearBranch]]);
  if (tianXiHits.length > 0) {
    items.push({
      key: "tianxi",
      name: "天喜",
      matchedPillars: tianXiHits,
      importance: "medium",
      meaning: "喜庆、人缘活络、关系转暖的信号较明显。",
      advice: "适合关系破冰、沟通修复、喜庆事项推进，但要看现实承接。"
    });
  }

  const luShenMap: Record<string, string> = {
    甲: "寅",
    乙: "卯",
    丙: "巳",
    丁: "午",
    戊: "巳",
    己: "午",
    庚: "申",
    辛: "酉",
    壬: "亥",
    癸: "子"
  };
  const luShenHits = pickPillarHits(pillars, [luShenMap[dayStem]]);
  if (luShenHits.length > 0) {
    items.push({
      key: "lushen",
      name: "禄神",
      matchedPillars: luShenHits,
      importance: "high",
      meaning: "个人资源、自我驱动力与现实获取能力较容易被看见。",
      advice: "适合靠专业、能力和持续输出换成果，也提醒别浪费自己的长项。"
    });
  }

  const yangRenMap: Record<string, string> = {
    甲: "卯",
    乙: "寅",
    丙: "午",
    丁: "巳",
    戊: "午",
    己: "巳",
    庚: "酉",
    辛: "申",
    壬: "子",
    癸: "亥"
  };
  const yangRenHits = pickPillarHits(pillars, [yangRenMap[dayStem]]);
  if (yangRenHits.length > 0) {
    items.push({
      key: "yangren",
      name: "羊刃",
      matchedPillars: yangRenHits,
      importance: "high",
      meaning: "行动力、冲劲、锋芒与对抗性被放大。",
      advice: "适合高执行和强决断场景，但关系里要防急躁、硬碰硬和过度消耗。"
    });
  }

  const feiRenMap: Record<string, string> = {
    甲: "酉",
    乙: "申",
    丙: "子",
    丁: "亥",
    戊: "子",
    己: "亥",
    庚: "卯",
    辛: "寅",
    壬: "午",
    癸: "巳"
  };
  const feiRenHits = pickPillarHits(pillars, [feiRenMap[dayStem]]);
  if (feiRenHits.length > 0) {
    items.push({
      key: "feiren",
      name: "飞刃",
      matchedPillars: feiRenHits,
      importance: "high",
      meaning: "以日干对冲羊刃之地，主突发锋芒、急促冲撞、决断过猛与意外耗损风险。",
      advice: "适合快节奏破局，但一定要防口舌升级、操作冒进和情绪型决策。"
    });
  }

  const taiJiMap: Record<string, string[]> = {
    甲: ["子", "午"],
    乙: ["子", "午"],
    丙: ["卯", "酉"],
    丁: ["卯", "酉"],
    戊: ["辰", "戌", "丑", "未"],
    己: ["辰", "戌", "丑", "未"],
    庚: ["寅", "亥"],
    辛: ["寅", "亥"],
    壬: ["巳", "申"],
    癸: ["巳", "申"]
  };
  const taiJiHits = pickPillarHits(
    pillars,
    uniqueStrings([...(taiJiMap[yearStem] ?? []), ...(taiJiMap[dayStem] ?? [])])
  );
  if (taiJiHits.length > 0) {
    items.push({
      key: "taiji",
      name: "太极贵人",
      matchedPillars: taiJiHits,
      importance: "medium",
      meaning: "悟性、思考深度、对玄学哲学规律性的感应更强。",
      advice: "适合研究、策划、咨询、命理心理等深思型方向。"
    });
  }

  const stemSequence = pillars.map((pillar) => pillar.heavenlyStem.value).join("");
  const sanQiMatches = ["甲戊庚", "乙丙丁", "壬癸辛"]
    .map((sequence) => stemSequence.indexOf(sequence))
    .filter((index) => index >= 0);
  if (sanQiMatches.length > 0) {
    const matchedPillars = uniqueStrings(
      sanQiMatches.flatMap((startIndex) =>
        pillars.slice(startIndex, startIndex + 3).map((pillar) =>
          pillar.name === "year"
            ? "年柱"
            : pillar.name === "month"
              ? "月柱"
              : pillar.name === "day"
                ? "日柱"
                : "时柱"
        )
      )
    );
    items.push({
      key: "sanqi",
      name: "三奇贵人",
      matchedPillars,
      importance: "high",
      tone: SHENSHA_CATALOG_BY_NAME.get("三奇贵人")?.tone ?? "吉",
      volume: SHENSHA_CATALOG_BY_NAME.get("三奇贵人")?.volume ?? "common",
      meaning: "四柱天干顺布成三奇，主思路特别、反应快、才智外放，较易形成非常规优势。",
      advice: "更适合把创意、策划、判断力和个人风格做成核心竞争力，但也要避免思路太跳导致落地不稳。"
    });
  }

  const groupBranchMaps = [yearBranch, dayBranch].map((branch) => ({
    water: { jieSha: "巳", zaiSha: "午", wangShen: "亥", guChen: "寅", guaSu: "戌" },
    fire: { jieSha: "亥", zaiSha: "子", wangShen: "巳", guChen: "巳", guaSu: "丑" },
    wood: { jieSha: "申", zaiSha: "酉", wangShen: "寅", guChen: "申", guaSu: "辰" },
    metal: { jieSha: "寅", zaiSha: "卯", wangShen: "申", guChen: "亥", guaSu: "未" }
  }[branchGroup(branch)]));

  const jieShaHits = pickPillarHits(pillars, uniqueStrings(groupBranchMaps.map((item) => item.jieSha)));
  if (jieShaHits.length > 0) {
    items.push({
      key: "jiesha",
      name: "劫煞",
      matchedPillars: jieShaHits,
      importance: "medium",
      meaning: "外界干扰、突发打断、资源被分流的情形更容易出现。",
      advice: "遇到关键事务要防被人事或节奏打断，重要决策宜留缓冲。"
    });
  }

  const zaiShaHits = pickPillarHits(pillars, uniqueStrings(groupBranchMaps.map((item) => item.zaiSha)));
  if (zaiShaHits.length > 0) {
    items.push({
      key: "zaisha",
      name: "灾煞",
      matchedPillars: zaiShaHits,
      importance: "medium",
      meaning: "表示某些阶段更容易有波折、烦扰或额外消耗。",
      advice: "不一定是大灾，但提醒凡事多做备选、少冒进。"
    });
  }

  const wangShenHits = pickPillarHits(pillars, uniqueStrings(groupBranchMaps.map((item) => item.wangShen)));
  if (wangShenHits.length > 0) {
    items.push({
      key: "wangshen",
      name: "亡神",
      matchedPillars: wangShenHits,
      importance: "medium",
      meaning: "精神紧绷、隐性耗能、心神不定或暗处阻力更值得留意。",
      advice: "重要阶段要防心态失衡、信息误差和看似没事却持续耗神。"
    });
  }

  const guChenHits = pickPillarHits(pillars, uniqueStrings(groupBranchMaps.map((item) => item.guChen)));
  if (guChenHits.length > 0) {
    items.push({
      key: "guchen",
      name: "孤辰",
      matchedPillars: guChenHits,
      importance: "low",
      meaning: "个体感、独自扛事、与人拉开距离的倾向更明显。",
      advice: "遇事不要只靠自己消化，关系里更要主动表达需求。"
    });
  }

  const guaSuHits = pickPillarHits(pillars, uniqueStrings(groupBranchMaps.map((item) => item.guaSu)));
  if (guaSuHits.length > 0) {
    items.push({
      key: "guasu",
      name: "寡宿",
      matchedPillars: guaSuHits,
      importance: "low",
      meaning: "关系体验里更容易出现落单感、情绪自闭或慢热防备。",
      advice: "不代表婚恋一定不好，更提醒要练习稳定表达和现实陪伴。"
    });
  }

  const xueTangGanzhiMap: Record<string, string[]> = {
    甲: ["己亥"],
    乙: ["壬午"],
    丙: ["丙寅"],
    丁: ["丁酉"],
    戊: ["戊寅"],
    己: ["己酉"],
    庚: ["辛巳"],
    辛: ["甲子"],
    壬: ["甲申"],
    癸: ["乙卯"]
  };
  const ciGuanGanzhiMap: Record<string, string[]> = {
    甲: ["庚寅"],
    乙: ["辛卯"],
    丙: ["乙巳"],
    丁: ["戊午"],
    戊: ["丁巳"],
    己: ["庚午"],
    庚: ["壬申"],
    辛: ["癸酉"],
    壬: ["癸亥"],
    癸: ["戊子"]
  };
  const xueTangNaYinBranchMap: Record<string, string[]> = {
    金: ["巳"],
    木: ["亥"],
    水: ["申"],
    火: ["寅"],
    土: ["申"]
  };
  const ciGuanNaYinBranchMap: Record<string, string[]> = {
    金: ["酉"],
    木: ["寅"],
    水: ["亥"],
    火: ["巳"],
    土: ["亥"]
  };
  const xueTangHits = uniqueStrings([
    ...pickPillarHitsByGanzhi(
      pillars,
      uniqueStrings([...(xueTangGanzhiMap[yearStem] ?? []), ...(xueTangGanzhiMap[dayStem] ?? [])])
    ),
    ...pickPillarHits(
      pillars,
      uniqueStrings([
        ...(xueTangNaYinBranchMap[getNaYinElement(yearNaYin)] ?? []),
        ...(xueTangNaYinBranchMap[getNaYinElement(dayNaYin)] ?? [])
      ])
    )
  ]);
  if (xueTangHits.length > 0) {
    items.push({
      key: "xuetang",
      name: "学堂",
      matchedPillars: xueTangHits,
      importance: "medium",
      tone: SHENSHA_CATALOG_BY_NAME.get("学堂")?.tone ?? "吉",
      volume: SHENSHA_CATALOG_BY_NAME.get("学堂")?.volume ?? "common",
      meaning: "以正学堂与纳音学堂并参，重看系统学习、理解吸收、知识沉淀与专业训练感。",
      advice: "适合长期学习、考证、研究、体系化输出，也适合做命理、教育、咨询等需要持续积累的方向。"
    });
  }

  const ciGuanHits = uniqueStrings([
    ...pickPillarHitsByGanzhi(
      pillars,
      uniqueStrings([...(ciGuanGanzhiMap[yearStem] ?? []), ...(ciGuanGanzhiMap[dayStem] ?? [])])
    ),
    ...pickPillarHits(
      pillars,
      uniqueStrings([
        ...(ciGuanNaYinBranchMap[getNaYinElement(yearNaYin)] ?? []),
        ...(ciGuanNaYinBranchMap[getNaYinElement(dayNaYin)] ?? [])
      ])
    )
  ]);
  if (ciGuanHits.length > 0) {
    items.push({
      key: "ciguan",
      name: "词馆",
      matchedPillars: ciGuanHits,
      importance: "medium",
      tone: SHENSHA_CATALOG_BY_NAME.get("词馆")?.tone ?? "吉",
      volume: SHENSHA_CATALOG_BY_NAME.get("词馆")?.volume ?? "common",
      meaning: "以正词馆与纳音词馆并参，重看表达、书写、内容包装、文思与对外呈现能力。",
      advice: "适合文案、策划、教学、传播、自媒体、咨询与需要输出观点和审美表达的方向。"
    });
  }

  const jinYuMap: Record<string, string[]> = {
    甲: ["辰"],
    乙: ["巳"],
    丙: ["未"],
    丁: ["申"],
    戊: ["未"],
    己: ["申"],
    庚: ["戌"],
    辛: ["亥"],
    壬: ["丑"],
    癸: ["寅"]
  };
  pushShenShaIfHit(items, pillars, {
    key: "jinyu",
    name: "金舆",
    branches: jinYuMap[dayStem] ?? [],
    importance: "medium",
    meaning: "资源承接、体面感、生活品质与被照顾运势较容易被点亮。",
    advice: "适合经营形象、待遇、居住条件与生活舒适度，也利婚恋稳定经营。"
  });

  const guoYinMap: Record<string, string[]> = {
    甲: ["戌"],
    乙: ["亥"],
    丙: ["丑"],
    丁: ["寅"],
    戊: ["丑"],
    己: ["寅"],
    庚: ["辰"],
    辛: ["巳"],
    壬: ["未"],
    癸: ["申"]
  };
  pushShenShaIfHit(items, pillars, {
    key: "guoyin",
    name: "国印贵人",
    branches: uniqueStrings([...(guoYinMap[yearStem] ?? []), ...(guoYinMap[dayStem] ?? [])]),
    importance: "medium",
    meaning: "规则、资质、身份认证、职称证照与正式体系中的助力感较明显。",
    advice: "适合争取证书、编制、头衔、平台背书或更规范的职业路径。"
  });

  const tianChuMap: Record<string, string[]> = {
    甲: ["巳"],
    乙: ["午"],
    丙: ["巳"],
    丁: ["午"],
    戊: ["申"],
    己: ["酉"],
    庚: ["亥"],
    辛: ["子"],
    壬: ["寅"],
    癸: ["卯"]
  };
  pushShenShaIfHit(items, pillars, {
    key: "tianchu",
    name: "天厨贵人",
    branches: tianChuMap[dayStem] ?? [],
    importance: "low",
    meaning: "口福、生活享受、审美品味和人情往来中的柔和资源更容易显现。",
    advice: "适合把生活品质、饮食、待客、关系润滑和审美表达作为加分项。"
  });

  const fuXingMap: Record<string, string[]> = {
    甲: ["寅", "子"],
    乙: ["卯", "丑"],
    丙: ["寅", "子"],
    丁: ["亥", "酉"],
    戊: ["申"],
    己: ["未"],
    庚: ["午"],
    辛: ["巳"],
    壬: ["辰"],
    癸: ["卯"]
  };
  pushShenShaIfHit(items, pillars, {
    key: "fuxing",
    name: "福星贵人",
    branches: fuXingMap[dayStem] ?? [],
    importance: "medium",
    meaning: "缓冲、转圜、享福与关键节点的顺势感相对更明显。",
      advice: "遇到重要节点时可以更主动承接资源，也要避免把好运完全耗散掉。"
  });

  const tianGuanMap: Record<string, string> = {
    甲: "未",
    乙: "辰",
    丙: "巳",
    丁: "酉",
    戊: "戌",
    己: "卯",
    庚: "丑",
    辛: "申",
    壬: "寅",
    癸: "午"
  };
  const tianGuanHits = pickPillarHits(
    pillars,
    uniqueStrings([tianGuanMap[yearStem], tianGuanMap[dayStem]])
  );
  if (tianGuanHits.length > 0) {
    items.push({
      key: "tianguan",
      name: "天官",
      matchedPillars: tianGuanHits,
      importance: "medium",
      meaning: "年干日干并参官贵之位，主名誉、职位、体制认可、规制意识与管理机会。",
      advice: "适合在组织、制度、品牌和权责体系中做进阶，但要靠持续履历承接。"
    });
  }

  const tianFuMap: Record<string, string> = {
    甲: "酉",
    乙: "申",
    丙: "子",
    丁: "亥",
    戊: "卯",
    己: "寅",
    庚: "午",
    辛: "巳",
    壬: "午",
    癸: "巳"
  };
  const tianFuHits = pickPillarHits(
    pillars,
    uniqueStrings([tianFuMap[yearStem], tianFuMap[dayStem]])
  );
  if (tianFuHits.length > 0) {
    items.push({
      key: "tianfu",
      name: "天福",
      matchedPillars: tianFuHits,
      importance: "medium",
      meaning: "按天福贵人口诀兼看年干、日干，主福气、体面、顺承与受人照应的机会感。",
      advice: "适合把口碑、礼仪、关系维护和稳定节奏作为加分项，贵气往往更怕急躁消耗。"
    });
  }

  const tianCaiBranchMap: Record<string, string[]> = {
    甲: ["辰", "戌", "丑", "未"],
    乙: ["辰", "戌", "丑", "未"],
    丙: ["申", "酉"],
    丁: ["申", "酉"],
    戊: ["亥", "子"],
    己: ["亥", "子"],
    庚: ["寅", "卯"],
    辛: ["寅", "卯"],
    壬: ["巳", "午"],
    癸: ["巳", "午"]
  };
  const tianCaiHits = uniqueStrings([
    ...pickPillarHits(pillars, uniqueStrings(tianCaiBranchMap[yearStem] ?? [])),
    ...pickPillarHits(pillars, uniqueStrings(tianCaiBranchMap[dayStem] ?? []))
  ]);
  if (tianCaiHits.length > 0) {
    items.push({
      key: "tiancai",
      name: "天财",
      matchedPillars: tianCaiHits,
      importance: "medium",
      meaning: "采用财星落支与财库并参的争议性口径，偏向判断财气显现、机会财与资源流入。",
      advice: "天财更适合当成财气加分项，而不是单独断大财；仍要结合日主强弱与流运看是否守得住。"
    });
  }

  const hongYanMap: Record<string, string[]> = {
    甲: ["午"],
    乙: ["申"],
    丙: ["寅"],
    丁: ["未"],
    戊: ["辰"],
    己: ["辰"],
    庚: ["戌"],
    辛: ["酉"],
    壬: ["子"],
    癸: ["申"]
  };
  pushShenShaIfHit(items, pillars, {
    key: "hongyan",
    name: "红艳",
    branches: hongYanMap[dayStem] ?? [],
    importance: "medium",
    meaning: "个人魅力、情感吸引、外形气质与情绪感染力较容易被放大。",
    advice: "对感情和曝光有加成，但更要注意边界与情绪管理，避免烂桃花。"
  });

  const tianLuoBranches = ["辰"];
  const diWangBranches = ["戌"];
  if (["戌", "亥"].includes(dayBranch) || ["戌", "亥"].includes(yearBranch)) {
    pushShenShaIfHit(items, pillars, {
      key: "tianluo",
      name: "天罗",
      branches: tianLuoBranches,
      importance: "low",
      meaning: "某些阶段更容易被复杂关系、规则束缚或反复牵扯住精力。",
      advice: "重要事项要预留退路和缓冲，不宜在情绪不稳时做强决定。"
    });
  }
  if (["辰", "巳"].includes(dayBranch) || ["辰", "巳"].includes(yearBranch)) {
    pushShenShaIfHit(items, pillars, {
      key: "diwang",
      name: "地网",
      branches: diWangBranches,
      importance: "low",
      meaning: "现实事务里更容易遇到拖延、牵制、责任缠绕或结构性阻力。",
      advice: "做复杂事务时要拆步骤、留证据、控节奏，避免被动陷入消耗。"
    });
  }

  const sangMenMap: Record<string, string> = {
    子: "寅",
    丑: "卯",
    寅: "辰",
    卯: "巳",
    辰: "午",
    巳: "未",
    午: "申",
    未: "酉",
    申: "戌",
    酉: "亥",
    戌: "子",
    亥: "丑"
  };
  pushShenShaIfHit(items, pillars, {
    key: "sangmen",
    name: "丧门",
    branches: [sangMenMap[yearBranch]],
    importance: "low",
    meaning: "情绪负担、家庭挂心或阶段性低压感更容易出现。",
    advice: "遇到家庭、情绪、健康相关议题时要提前安排和稳住生活秩序。"
  });

  const diaoKeMap: Record<string, string> = {
    子: "戌",
    丑: "亥",
    寅: "子",
    卯: "丑",
    辰: "寅",
    巳: "卯",
    午: "辰",
    未: "巳",
    申: "午",
    酉: "未",
    戌: "申",
    亥: "酉"
  };
  pushShenShaIfHit(items, pillars, {
    key: "diaoke",
    name: "吊客",
    branches: [diaoKeMap[yearBranch]],
    importance: "low",
    meaning: "阶段性容易被外部事件、消息波动或人情事务牵动心神。",
      advice: "重要阶段少被杂音带节奏，处理复杂事务时先稳住主线。"
  });

  const gouShaMap: Record<string, string> = {
    子: "酉",
    丑: "戌",
    寅: "亥",
    卯: "子",
    辰: "丑",
    巳: "寅",
    午: "卯",
    未: "辰",
    申: "巳",
    酉: "午",
    戌: "未",
    亥: "申"
  };
  const jiaoShaMap: Record<string, string> = {
    子: "卯",
    丑: "辰",
    寅: "巳",
    卯: "午",
    辰: "未",
    巳: "申",
    午: "酉",
    未: "戌",
    申: "亥",
    酉: "子",
    戌: "丑",
    亥: "寅"
  };
  const gouJiaoHits = uniqueStrings([
    ...pickPillarHits(pillars, [jiaoShaMap[yearBranch]]),
    ...pickPillarHits(pillars, [gouShaMap[yearBranch]])
  ]);
  if (gouJiaoHits.length > 0) {
    items.push({
      key: "goujiaosha",
      name: "勾绞煞",
      matchedPillars: gouJiaoHits,
      importance: "medium",
      meaning: "主口舌、人情纠缠、关系误解与事情反复拉扯，常见于边界不清或情绪对冲之时。",
      advice: "越是合作、婚恋、资金与承诺类事务，越要留痕、讲规则、少带情绪硬碰。"
    });
  }

  const piMaMap: Record<string, string> = {
    子: "卯",
    丑: "辰",
    寅: "巳",
    卯: "午",
    辰: "未",
    巳: "申",
    午: "酉",
    未: "戌",
    申: "亥",
    酉: "子",
    戌: "丑",
    亥: "寅"
  };
  const piMaHits = pickPillarHits(pillars, [piMaMap[yearBranch]]);
  if (piMaHits.length > 0) {
    items.push({
      key: "pima",
      name: "披麻",
      matchedPillars: piMaHits,
      importance: "low",
      meaning: "主劳心劳力、家务牵扯、情绪阴耗与阶段性压抑感，常和外务奔波并行。",
      advice: "这类阶段更适合稳秩序、减内耗、少替别人过度承担。"
    });
  }

  const samePolarityGender =
    (isYangStem(yearStem) && gender === "male") || (!isYangStem(yearStem) && gender === "female");
  const yuanChenMap: Record<string, string> = samePolarityGender
    ? {
        子: "未",
        丑: "申",
        寅: "酉",
        卯: "戌",
        辰: "亥",
        巳: "子",
        午: "丑",
        未: "寅",
        申: "卯",
        酉: "辰",
        戌: "巳",
        亥: "午"
      }
    : {
        子: "巳",
        丑: "午",
        寅: "未",
        卯: "申",
        辰: "酉",
        巳: "戌",
        午: "亥",
        未: "子",
        申: "丑",
        酉: "寅",
        戌: "卯",
        亥: "辰"
      };
  const yuanChenHits = pickPillarHits(pillars, [yuanChenMap[yearBranch]]);
  if (yuanChenHits.length > 0) {
    items.push({
      key: "yuanchen",
      name: "元辰",
      matchedPillars: yuanChenHits,
      importance: "medium",
      meaning: "主情绪郁滞、拖延反复、内耗回圈与心神难定，常在关系或现实压力下放大。",
      advice: "出现元辰时，先稳睡眠、稳节律、稳边界，很多问题会先降一半。"
    });
  }

  const yueDeMap: Record<string, string> = {
    寅: "丙",
    午: "丙",
    戌: "丙",
    申: "壬",
    子: "壬",
    辰: "壬",
    亥: "甲",
    卯: "甲",
    未: "甲",
    巳: "庚",
    酉: "庚",
    丑: "庚"
  };
  const yueDeTargets = splitMixedTargets([yueDeMap[monthBranch]]);
  pushShenShaIfHit(items, pillars, {
    key: "yuede",
    name: "月德贵人",
    branches: yueDeTargets.branches,
    stems: yueDeTargets.stems,
    importance: "medium",
    meaning: "以月支定月德，主温和转圜、人情缓冲、协商余地与逢冲可解的柔性资源。",
    advice: "适合在关系修复、流程协商、求人求助与资源协调时主动使用柔性方法。"
  });

  const yueDeHeMap: Record<string, string> = {
    寅: "辛",
    午: "辛",
    戌: "辛",
    申: "丁",
    子: "丁",
    辰: "丁",
    亥: "己",
    卯: "己",
    未: "己",
    巳: "乙",
    酉: "乙",
    丑: "乙"
  };
  const yueDeHeTargets = splitMixedTargets([yueDeHeMap[monthBranch]]);
  pushShenShaIfHit(items, pillars, {
    key: "yuedehe",
    name: "月德合",
    branches: yueDeHeTargets.branches,
    stems: yueDeHeTargets.stems,
    importance: "medium",
    meaning: "月德合偏重和合修补，利关系润滑、谈判缓冲、误会化解与局面回暖。",
    advice: "凡涉及合作、感情、沟通与手续推进，越稳越柔，越能把这股和气接住。"
  });

  const tianDeMap: Record<string, string> = {
    寅: "丁",
    卯: "申",
    辰: "壬",
    巳: "辛",
    午: "亥",
    未: "甲",
    申: "癸",
    酉: "寅",
    戌: "丙",
    亥: "乙",
    子: "巳",
    丑: "庚"
  };
  const tianDeTargets = splitMixedTargets([tianDeMap[monthBranch]]);
  pushShenShaIfHit(items, pillars, {
    key: "tiande",
    name: "天德贵人",
    branches: tianDeTargets.branches,
    stems: tianDeTargets.stems,
    importance: "medium",
    meaning: "以月令所主天德查四柱，重在减损化缓、守正得护、关键处有解围空间。",
    advice: "越是复杂局面，越适合走正路、留余地、做修补动作，往往更有转机。"
  });

  const tianDeHeMap: Record<string, string> = {
    寅: "壬",
    卯: "寅",
    辰: "丁",
    巳: "丙",
    午: "寅",
    未: "己",
    申: "戊",
    酉: "亥",
    戌: "辛",
    亥: "庚",
    子: "申",
    丑: "乙"
  };
  const tianDeHeTargets = splitMixedTargets([tianDeHeMap[monthBranch]]);
  pushShenShaIfHit(items, pillars, {
    key: "tiandehe",
    name: "天德合",
    branches: tianDeHeTargets.branches,
    stems: tianDeHeTargets.stems,
    importance: "medium",
    meaning: "天德合更强调以柔化刚、遇冲有合、在紧张局面中找到缓冲和修补空间。",
    advice: "适合做和解、收尾、修复关系和补缺动作，忌情绪化把本可回缓的局面推硬。"
  });

  const liuXiaMap: Record<string, string[]> = {
    甲: ["酉"],
    乙: ["戌"],
    丙: ["未"],
    丁: ["申"],
    戊: ["巳"],
    己: ["午"],
    庚: ["辰"],
    辛: ["卯"],
    壬: ["亥"],
    癸: ["寅"]
  };
  pushShenShaIfHit(items, pillars, {
    key: "liuxia",
    name: "流霞",
    branches: liuXiaMap[dayStem] ?? [],
    importance: "low",
    meaning: "情绪、关系、酒色应酬或一时冲动带来的牵扯感更容易被放大。",
    advice: "涉及感情、口舌、娱乐、应酬和夜间决策时要更注意分寸。"
  });

  const tianYiMedicalMap: Record<string, string[]> = {
    子: ["亥"],
    丑: ["子"],
    寅: ["丑"],
    卯: ["寅"],
    辰: ["卯"],
    巳: ["辰"],
    午: ["巳"],
    未: ["午"],
    申: ["未"],
    酉: ["申"],
    戌: ["酉"],
    亥: ["戌"]
  };
  pushShenShaIfHit(items, pillars, {
    key: "tianyi-medical",
    name: "天医",
    branches: tianYiMedicalMap[monthBranch] ?? [],
    importance: "low",
    meaning: "对修复、疗愈、养护、医学健康和照顾能力的感应更明显。",
      advice: "适合把养生、修复、情绪稳定和身心照护当成长期加分项。"
  });

  const xueRenDayStemMap: Record<string, string> = {
    甲: "卯",
    乙: "辰",
    丙: "午",
    丁: "未",
    戊: "午",
    己: "未",
    庚: "酉",
    辛: "戌",
    壬: "子",
    癸: "丑"
  };
  const xueRenMonthMap: Record<string, string> = {
    寅: "丑",
    卯: "未",
    辰: "寅",
    巳: "申",
    午: "卯",
    未: "酉",
    申: "辰",
    酉: "戌",
    戌: "巳",
    亥: "亥",
    子: "午",
    丑: "子"
  };
  const xueRenHits = uniqueStrings([
    ...pickPillarHits(pillars, [xueRenDayStemMap[dayStem]]),
    ...pickPillarHits(pillars, [xueRenMonthMap[monthBranch]])
  ]);
  if (xueRenHits.length > 0) {
    items.push({
      key: "xueren",
      name: "血刃",
      matchedPillars: xueRenHits,
      importance: "medium",
      meaning: "综合日干法与月支法并参，主血光损伤、手术创口、激烈碰撞与急性耗损风险。",
      advice: "行运再冲时更要注意驾驶、金属、运动、炎症与冲动型对抗。"
    });
  }

  const seasonGroups = {
    spring: ["寅", "卯", "辰"],
    summer: ["巳", "午", "未"],
    autumn: ["申", "酉", "戌"],
    winter: ["亥", "子", "丑"]
  };
  const deXiuStemMap: Record<keyof typeof seasonGroups, string[]> = {
    spring: ["甲", "乙", "丙", "丁"],
    summer: ["丙", "丁", "戊", "己"],
    autumn: ["庚", "辛", "壬", "癸"],
    winter: ["壬", "癸", "甲", "乙"]
  };
  const monthSeason = (Object.entries(seasonGroups).find(([, branches]) => branches.includes(monthBranch))?.[0] ??
    "spring") as keyof typeof seasonGroups;
  pushShenShaIfHit(items, pillars, {
    key: "dexiu",
    name: "德秀贵人",
    stems: deXiuStemMap[monthSeason],
    importance: "medium",
    meaning: "气质、才华、修养、表达方式与被看见的文雅感更容易成立。",
    advice: "适合走审美表达、知识输出、咨询策划、品牌形象和口碑积累路线。"
  });

  const tianSheBySeason: Record<keyof typeof seasonGroups, string[]> = {
    spring: ["戊寅"],
    summer: ["甲午"],
    autumn: ["戊申"],
    winter: ["甲子"]
  };
  if (tianSheBySeason[monthSeason].includes(dayPillar)) {
    items.push({
      key: "tianshe",
      name: "天赦",
      matchedPillars: ["日柱"],
      importance: "medium",
      meaning: "较有逢凶化缓、事后转圜、困难中留余地的意味。",
      advice: "适合把握修复、和解、纠偏、补救类动作，但仍要顺势而行。"
    });
  }

  if (["甲辰", "甲戌", "乙巳", "丙午", "丁未", "戊申", "戊寅", "辛亥", "壬子", "癸丑"].includes(dayPillar)) {
    items.push({
      key: "shiling",
      name: "十灵日",
      matchedPillars: ["日柱"],
      importance: "low",
      meaning: "直觉、灵感、悟性与对抽象信息的敏感度相对更高。",
      advice: "适合玄学、艺术、心理、创作、研究等需要感知与悟性的方向。"
    });
  }

  if (["乙巳", "丁巳", "辛亥", "癸亥", "乙亥", "丁亥", "辛巳", "癸巳"].includes(dayPillar)) {
    items.push({
      key: "guluan",
      name: "孤鸾",
      matchedPillars: ["日柱"],
      importance: "low",
      meaning: "情感体验中更强调自我感受、理想标准或关系里的节奏差异。",
      advice: "不是一定婚恋不好，更提示要学会现实沟通、稳定陪伴与长期经营。"
    });
  }

  if (
    [
      "甲寅",
      "乙卯",
      "戊辰",
      "己未",
      "庚申",
      "辛酉",
      "壬子",
      "癸亥",
      "丁未",
      "戊戌"
    ].includes(dayPillar)
  ) {
    items.push({
      key: "bazhuan",
      name: "八专",
      matchedPillars: ["日柱"],
      importance: "medium",
      meaning: "八专以日柱本气全合为主，主专一、执着、偏锋感与事务推进上的不易转向。",
      advice: "适合把专注力转成专业优势，但关系和合作里要防过度执拗、认死理和一条路走到黑。"
    });
  }

  if (
    ["壬子", "壬午", "戊子", "戊午", "己卯", "己酉", "乙卯", "乙酉", "辛卯", "辛酉"].includes(
      dayPillar
    )
  ) {
    items.push({
      key: "jiuchou",
      name: "九丑",
      matchedPillars: ["日柱"],
      importance: "low",
      meaning: "九丑日主感情、名誉、欲望与人际边界更易形成纠缠，往往要靠节制与分寸化解。",
      advice: "涉及感情、酒色、口舌和公众评价时，更要慢一点、稳一点、少做高风险选择。"
    });
  }

  if (["乙丑", "己巳", "癸酉"].includes(dayPillar) || ["乙丑", "己巳", "癸酉"].includes(pillars[3].ganzhi)) {
    items.push({
      key: "jinshen",
      name: "金神",
      matchedPillars: uniqueStrings([
        ...(["乙丑", "己巳", "癸酉"].includes(dayPillar) ? ["日柱"] : []),
        ...(["乙丑", "己巳", "癸酉"].includes(pillars[3].ganzhi) ? ["时柱"] : [])
      ]),
      importance: "medium",
      meaning: "主刚烈、果断、极端执行与强烈斩断力，成则猛进，失衡则过刚易折。",
      advice: "适合做决断型事务，但一定要给自己留复盘和缓冲机制。"
    });
  }

  if (["丙午", "丁未", "戊子", "戊午", "己丑", "己未"].includes(dayPillar)) {
    items.push({
      key: "liuxiuri",
      name: "六秀日",
      matchedPillars: ["日柱"],
      importance: "low",
      meaning: "主秀气、审美、细腻表达与文艺气质，常见于感受力与呈现力较强的人身上。",
      advice: "很适合把气质、表达、设计、内容和审美做成个人优势。"
    });
  }

  const tongZiDayHourHits = uniqueStrings(
    pillars
      .filter((pillar) => pillar.name === "day" || pillar.name === "hour")
      .filter((pillar) => {
        const zhi = pillar.earthlyBranch.value;
        const yearNaYinElement = getNaYinElement(yearNaYin);
        if (["寅", "卯", "辰", "申", "酉", "戌"].includes(monthBranch) && ["寅", "子"].includes(zhi)) {
          return true;
        }
        if (["巳", "午", "未", "亥", "子", "丑"].includes(monthBranch) && ["卯", "未", "辰"].includes(zhi)) {
          return true;
        }
        if (["金", "木"].includes(yearNaYinElement) && ["午", "卯"].includes(zhi)) {
          return true;
        }
        if (["水", "火"].includes(yearNaYinElement) && ["酉", "戌"].includes(zhi)) {
          return true;
        }
        if (yearNaYinElement === "土" && ["辰", "巳"].includes(zhi)) {
          return true;
        }
        return false;
      })
      .map((pillar) => (pillar.name === "day" ? "日柱" : "时柱"))
  );
  if (tongZiDayHourHits.length > 0) {
    items.push({
      key: "tongzisha",
      name: "童子煞",
      matchedPillars: tongZiDayHourHits,
      importance: "low",
      meaning: "以月令、纳音与日时并参，主精神敏感、理想色彩重、俗缘感偏淡或心性较清。",
      advice: "适合往艺术、宗教、玄学、心理、疗愈与高感知方向发展，但要做好现实落地。"
    });
  }

  if (
    [
      "丙子",
      "丙午",
      "丁丑",
      "丁未",
      "戊寅",
      "戊申",
      "辛卯",
      "辛酉",
      "壬辰",
      "壬戌",
      "癸巳",
      "癸亥"
    ].includes(dayPillar)
  ) {
    items.push({
      key: "yinchayangcuo",
      name: "阴差阳错",
      matchedPillars: ["日柱"],
      importance: "low",
      meaning: "人与人之间容易出现时机错位、理解落差、好意落空或节奏不对拍。",
      advice: "凡涉及关系、合作、婚恋和关键沟通，更要多确认、少想当然。"
    });
  }

  const uniqueItems = new Map<string, ShenShaItem>();
  for (const item of items) {
    if (!uniqueItems.has(item.key)) {
      uniqueItems.set(item.key, item);
      continue;
    }

    const current = uniqueItems.get(item.key)!;
    uniqueItems.set(item.key, {
      ...current,
      matchedPillars: [...new Set([...current.matchedPillars, ...item.matchedPillars])]
    });
  }

  const importanceRank = { high: 0, medium: 1, low: 2 } as const;
  const volumeRank = { common: 0, uncommon: 1 } as const;
  const toneRank = { 吉: 0, 中: 1, 凶: 2 } as const;
  const finalItems = [...uniqueItems.values()]
    .map((item) => {
      const catalogMeta = SHENSHA_CATALOG_BY_NAME.get(item.name);

      return {
        ...item,
        tone: catalogMeta?.tone ?? item.tone ?? "中",
        volume: catalogMeta?.volume ?? item.volume ?? "common",
        meaning: item.meaning || catalogMeta?.shortNote || "",
        advice: item.advice || catalogMeta?.fullNote || ""
      };
    })
    .sort((a, b) => {
      const importanceDiff = importanceRank[a.importance] - importanceRank[b.importance];
      if (importanceDiff !== 0) {
        return importanceDiff;
      }

      const volumeDiff = volumeRank[a.volume] - volumeRank[b.volume];
      if (volumeDiff !== 0) {
        return volumeDiff;
      }

      const toneDiff = toneRank[a.tone] - toneRank[b.tone];
      return toneDiff !== 0 ? toneDiff : a.name.localeCompare(b.name, "zh-CN");
    });

  const commonItems = finalItems.filter((item) => item.volume === "common");
  const uncommonItems = finalItems.filter((item) => item.volume === "uncommon");

  return {
    items: finalItems,
    commonItems,
    uncommonItems,
    summary:
      finalItems.length > 0
        ? `当前命盘共命中 ${finalItems.length} 项神煞，其中常用 ${commonItems.length} 项、不常用 ${uncommonItems.length} 项。重点可先看 ${finalItems
            .slice(0, 8)
            .map((item) => item.name)
            .join("、")}。`
        : "当前命盘中没有特别集中的强提示型神煞，仍建议以旺衰、格局和流运为主轴判断。"
  };
}

function buildAdvancedFlowAnalysis(
  daYun: ReturnType<typeof getDaYunSummary>,
  flowAnalysis: ReturnType<typeof getCurrentDaYunDetail>
) {
  if (!flowAnalysis.supported) {
    return flowAnalysis;
  }

  const currentDaYun = flowAnalysis.currentDaYun!;
  const currentLiuNian = flowAnalysis.currentLiuNian!;
  const liuNianTimeline = flowAnalysis.liuNianTimeline ?? [];
  const liuYue = flowAnalysis.liuYue ?? [];
  const daYunPanels = daYun.supported ? (daYun.daYun ?? []) : [];

  const yearlyScores = liuNianTimeline.map((item) => ({
    year: item.year,
    age: item.age,
    ganzhi: item.ganzhi,
    score: Math.max(38, Math.min(96, Math.round(68 + item.flowInsight.score * 12))),
    tone:
      item.flowInsight.favorability === "favorable"
        ? "good"
        : item.flowInsight.favorability === "challenging"
          ? "care"
          : "neutral",
    note: item.flowInsight.note
  }));

  const monthlyScores = liuYue.map((item) => ({
    month: item.monthChinese,
    monthOrder: item.monthOrder,
    ganzhi: item.ganzhi,
    score: Math.max(40, Math.min(95, Math.round(67 + item.flowInsight.score * 10))),
    tone:
      item.flowInsight.favorability === "favorable"
        ? "good"
        : item.flowInsight.favorability === "challenging"
          ? "care"
          : "neutral",
    note: item.flowInsight.note
  }));

  return {
    focusYear: flowAnalysis.focusYear,
    currentDaYunHeadline: `${currentDaYun.ganzhi} 大运（${currentDaYun.startYear}-${currentDaYun.endYear}）`,
    currentYearHeadline: `${currentLiuNian.year} ${currentLiuNian.ganzhi}`,
    yearlyScores,
    monthlyScores,
    featuredYears: yearlyScores
      .filter((item) => item.score >= 78 || item.score <= 58)
      .slice(0, 6),
    favorableWindows: monthlyScores.filter((item) => item.tone === "good").slice(0, 4),
    cautionWindows: monthlyScores.filter((item) => item.tone === "care").slice(0, 3),
    daYunPanels: daYun.supported
      ? daYunPanels.map((item) => ({
          ganzhi: item.ganzhi,
          yearRange: `${item.startYear}-${item.endYear}`,
          ageRange: `${item.startAge}-${item.endAge}岁`
        }))
      : [],
    strategySummary:
      currentDaYun.flowInsight.favorability === "favorable"
        ? "当前大运整体偏可发力，但更适合按节奏递进，不宜躁进。"
        : currentDaYun.flowInsight.favorability === "challenging"
          ? "当前大运更重结构调整和稳盘，重要动作宜挑流年流月窗口。"
          : "当前大运偏中性，成败更看个人选择与月份窗口。"
  };
}

export function buildLunarPickerOptions(
  year: number,
  month: number | undefined = undefined,
  day: number | undefined = undefined
) {
  const lunarYear = LunarYear.fromYear(year);
  const months = lunarYear.getMonthsInYear().map((item) => ({
    value: item.getMonth(),
    label: `${item.isLeap() ? "闰" : ""}${Math.abs(item.getMonth())}月`,
    isLeap: item.isLeap(),
    dayCount: item.getDayCount(),
    ganzhi: item.getGanZhi()
  }));

  const pickedMonth = month !== undefined ? lunarYear.getMonth(month) : lunarYear.getMonthsInYear()[0];
  const days =
    pickedMonth !== null
      ? Array.from({ length: pickedMonth.getDayCount() }, (_, index) => ({
          value: index + 1,
          label: `${index + 1}日`
        }))
      : [];

  return {
    year,
    yearLabel: `${year}年`,
    leapMonth: lunarYear.getLeapMonth(),
    months,
    days,
    selected: {
      month: pickedMonth?.getMonth() ?? null,
      day: day ?? 1
    },
    hourOptions: [
      { value: "23:00", label: "子时", range: "23:00-00:59" },
      { value: "01:00", label: "丑时", range: "01:00-02:59" },
      { value: "03:00", label: "寅时", range: "03:00-04:59" },
      { value: "05:00", label: "卯时", range: "05:00-06:59" },
      { value: "07:00", label: "辰时", range: "07:00-08:59" },
      { value: "09:00", label: "巳时", range: "09:00-10:59" },
      { value: "11:00", label: "午时", range: "11:00-12:59" },
      { value: "13:00", label: "未时", range: "13:00-14:59" },
      { value: "15:00", label: "申时", range: "15:00-16:59" },
      { value: "17:00", label: "酉时", range: "17:00-18:59" },
      { value: "19:00", label: "戌时", range: "19:00-20:59" },
      { value: "21:00", label: "亥时", range: "21:00-22:59" }
    ]
  };
}

export function analyzeBazi(input: {
  calendarType: CalendarType;
  birthDate: string;
  birthTime: string;
  gender: Gender;
  birthPlace: string;
  focusYear?: number;
  isVip?: boolean;
}) {
  const parsed = parseBirthInput(input.calendarType, input.birthDate, input.birthTime);
  const { solar, lunar } = getLunarFromInput(parsed);
  const { eightChar, pillars } = getPillarVisuals(lunar);
  const baZi = lunar.getBaZi();
  const wuXingStats = countWuXing(baZi);
  const dayMaster = pillars[2].heavenlyStem;
  const strength = getStrengthAnalysis(pillars);
  const focusYear = input.focusYear ?? new Date().getFullYear();
  const daYun = getDaYunSummary(lunar, input.gender, strength.favorableElements, strength.unfavorableElements);
  const shenShaAnalysis = buildShenShaAnalysis(pillars, input.gender);
  const flowAnalysis = getCurrentDaYunDetail(
    lunar,
    input.gender,
    focusYear,
    strength.favorableElements,
    strength.unfavorableElements
  );
  const premiumAnalysis = buildPremiumAnalysis({
    pillars,
    strengthLevel: strength.level,
    dayMaster: strength.dayMaster,
    favorableElements: strength.favorableElements,
    unfavorableElements: strength.unfavorableElements,
    flowAnalysis,
    isVip: input.isVip ?? false
  });

  return {
    input,
    calendar: {
      solar: solar.toYmdHms(),
      lunar: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeInGanZhi()}时`,
      season: lunar.getSeason(),
      jieQi: lunar.getJieQi(),
      zodiac: lunar.getYearShengXiaoExact()
    },
    baZi,
    pillars,
    dayMaster: {
      ...dayMaster,
      label: `${dayMaster.value}日主`
    },
    chartMeta: {
      taiYuan: {
        value: eightChar.getTaiYuan(),
        naYin: eightChar.getTaiYuanNaYin()
      },
      taiXi: {
        value: eightChar.getTaiXi(),
        naYin: eightChar.getTaiXiNaYin()
      },
      mingGong: {
        value: eightChar.getMingGong(),
        naYin: eightChar.getMingGongNaYin()
      },
      shenGong: {
        value: eightChar.getShenGong(),
        naYin: eightChar.getShenGongNaYin()
      }
    },
    wuXingStats,
    strengthAnalysis: {
      level: strength.level,
      levelLabel: strength.levelLabel,
      supportScore: strength.supportScore,
      drainScore: strength.drainScore,
      delta: strength.delta,
      favorableElements: toElementVisualList(strength.favorableElements),
      unfavorableElements: toElementVisualList(strength.unfavorableElements),
      reasoning: strength.reasoning
    },
    overview: {
      wuxingBalanceHint: buildWuXingBalanceHint(wuXingStats),
      displayNote: "天干地支已按所属五行返回配色，可直接用于前端排盘展示。",
      favorableUsage:
        strength.level === "strong"
          ? "命局偏旺时，通常更适合顺着食伤、财星、官杀方向做释放与制衡。"
          : strength.level === "weak"
            ? "命局偏弱时，通常更适合先补印比根气，再承接财官事务。"
            : "命局较平时，可结合大运和流年流月选择更合适的发力窗口。"
    },
    shenShaAnalysis,
    premiumAnalysis,
    daYun,
    flowAnalysis,
    flowAdvanced: buildAdvancedFlowAnalysis(daYun, flowAnalysis)
  };
}

export function analyzeBaziCompatibility(input: {
  relationType: CompatibilityRelationType;
  focusYear?: number;
  isVip?: boolean;
  personA: {
    calendarType: CalendarType;
    birthDate: string;
    birthTime: string;
    gender: Gender;
    birthPlace: string;
  };
  personB: {
    calendarType: CalendarType;
    birthDate: string;
    birthTime: string;
    gender: Gender;
    birthPlace: string;
  };
}) {
  const focusYear = input.focusYear ?? new Date().getFullYear();

  if (!(input.isVip ?? false)) {
    return {
      relationType: input.relationType,
      relationLabel: getRelationLabel(input.relationType),
      focusYear,
      vipOnly: true as const,
      unlocked: false as const,
      preview: {
        title: "合盘为 VIP 专属功能",
        summary: "八字合盘已设为完整 VIP 解锁内容，开通后可查看双方旺衰、喜忌、关系协同与专项合盘分析。",
        modules: [
          "双方八字旺衰与喜忌对照",
          "关系协调度与摩擦点",
          "共事情况与合作边界分析",
          "同性情侣专项合盘",
          "流年流月关系节奏提醒"
        ]
      },
      upsellMessage: "开通 VIP 后可查看完整合盘结果。"
    };
  }

  const personA = analyzeBazi({ ...input.personA, focusYear, isVip: false });
  const personB = analyzeBazi({ ...input.personB, focusYear, isVip: false });

  const sharedFavorable = intersectElements(
    personA.strengthAnalysis.favorableElements.map((item) => item.name as WuXingName),
    personB.strengthAnalysis.favorableElements.map((item) => item.name as WuXingName)
  );
  const frictionElements = uniqueElements([
    ...personA.strengthAnalysis.unfavorableElements.map((item) => item.name as WuXingName),
    ...personB.strengthAnalysis.unfavorableElements.map((item) => item.name as WuXingName)
  ]);

  const relationLabel = getRelationLabel(input.relationType);
  const complementScore = getComplementScore(personA, personB, sharedFavorable);

  return {
    relationType: input.relationType,
    relationLabel,
    focusYear,
    vipOnly: true as const,
    unlocked: true as const,
    pairSummary: {
      compatibilityScore: complementScore,
      compatibilityLevel: getCompatibilityLevel(complementScore),
      sharedFavorableElements: sharedFavorable.map(toElementSummary),
      frictionElements: frictionElements.map(toElementSummary),
      keyMessage: buildCompatibilityMessage(input.relationType, complementScore, sharedFavorable, frictionElements)
    },
    compatibilityDashboard: buildCompatibilityDashboard(input.relationType, personA, personB, complementScore),
    marketNarrative: buildCompatibilityMarketNarrative(input.relationType),
    compatibilityCharts: buildCompatibilityCharts(personA, personB, sharedFavorable, frictionElements),
    personA: {
      calendar: personA.calendar,
      dayMaster: personA.dayMaster,
      strengthAnalysis: personA.strengthAnalysis,
      premiumUnlocked: false
    },
    personB: {
      calendar: personB.calendar,
      dayMaster: personB.dayMaster,
      strengthAnalysis: personB.strengthAnalysis,
      premiumUnlocked: false
    },
    synergy: {
      emotional: buildSynergyBlock("emotional", input.relationType, personA, personB, sharedFavorable, frictionElements),
      collaboration: buildSynergyBlock("collaboration", input.relationType, personA, personB, sharedFavorable, frictionElements),
      rhythm: buildSynergyBlock("rhythm", input.relationType, personA, personB, sharedFavorable, frictionElements)
    },
    premiumCompatibilityAnalysis: buildCompatibilityPremium({
      relationType: input.relationType,
      isVip: true,
      personA,
      personB,
      sharedFavorable,
      frictionElements,
      complementScore
    })
  };
}

function buildCompatibilityCharts(
  personA: ReturnType<typeof analyzeBazi>,
  personB: ReturnType<typeof analyzeBazi>,
  sharedFavorable: WuXingName[],
  frictionElements: WuXingName[]
) {
  const strengthChart = {
    title: "双方旺衰对照",
    description: "用于展示两个人各自命局的扶助力量与耗泄力量，数值越高表示该侧力量越明显。",
    series: [
      {
        person: "A",
        level: personA.strengthAnalysis.levelLabel,
        supportScore: personA.strengthAnalysis.supportScore,
        drainScore: personA.strengthAnalysis.drainScore,
        delta: personA.strengthAnalysis.delta,
        explanation: explainStrengthState(personA)
      },
      {
        person: "B",
        level: personB.strengthAnalysis.levelLabel,
        supportScore: personB.strengthAnalysis.supportScore,
        drainScore: personB.strengthAnalysis.drainScore,
        delta: personB.strengthAnalysis.delta,
        explanation: explainStrengthState(personB)
      }
    ]
  };

  const fiveElementContrast = {
    title: "五行对照图",
    description: "对照双方八字中五行分布的多少，方便前端做柱状图、雷达图或堆叠条图。",
    elements: WU_XING_ORDER.map((element) => {
      const aStat = personA.wuXingStats.find((item) => item.name === element)!;
      const bStat = personB.wuXingStats.find((item) => item.name === element)!;

      return {
        element,
        colorName: aStat.colorName,
        colorHex: aStat.colorHex,
        personA: aStat.count,
        personB: bStat.count,
        explanation: explainElementContrast(element, aStat.count, bStat.count, personA, personB)
      };
    })
  };

  const synergyMatrix = {
    title: "关系增益与摩擦矩阵",
    description: "将双方共同有利五行与共同摩擦五行分开展示，方便前端做标签组和图文说明。",
    growth: sharedFavorable.map((item) => buildChartExplainItem(item, "growth")),
    friction: frictionElements.map((item) => buildChartExplainItem(item, "friction"))
  };

  const textualPanels = {
    title: "图文讲解面板",
    cards: [
      {
        heading: "谁更旺、谁更弱",
        body: `A ${personA.strengthAnalysis.levelLabel}，B ${personB.strengthAnalysis.levelLabel}。旺衰不是简单的好坏，而是说明一个人当前命局更偏向“自带力量足”还是“需要外部生扶”。`
      },
      {
        heading: "为什么会旺或不旺",
        body: `主要依据月令、四柱五行分布、日主得令与否、同类生扶和财官食伤的耗泄情况来判断。当前 A 的判断理由是：${personA.strengthAnalysis.reasoning}；B 的判断理由是：${personB.strengthAnalysis.reasoning}`
      },
      {
        heading: "合盘里什么部分算更合",
        body: sharedFavorable.length > 0
          ? `双方在 ${sharedFavorable.join("、")} 上更容易形成共同舒适区，这些五行对应的生活方式、价值节奏或合作方式更容易让关系稳定。`
          : "双方没有特别重叠的共同喜用方向，意味着关系不靠天然顺滑，更需要规则、沟通和选择合适的相处方式。"
      },
      {
        heading: "合盘里什么部分需要注意",
        body: frictionElements.length > 0
          ? `${frictionElements.join("、")} 是这段关系里更容易失衡的部分。它不代表一定不好，而是提示这些五行对应的问题更容易成为摩擦来源，需要提前建立沟通和边界。`
          : "当前合盘中没有特别集中的共同摩擦五行，但仍要结合流年流月动态观察。"
      }
    ]
  };

  return {
    strengthChart,
    fiveElementContrast,
    synergyMatrix,
    textualPanels
  };
}

function buildCompatibilityDashboard(
  relationType: CompatibilityRelationType,
  personA: ReturnType<typeof analyzeBazi>,
  personB: ReturnType<typeof analyzeBazi>,
  score: number
) {
  return {
    hero: {
      score,
      relationType,
      headline:
        relationType === "same-sex-couple"
          ? "亲密连接与现实承接要同时成立"
          : relationType === "partner" || relationType === "colleague" || relationType === "boss-employee"
            ? "分工与边界比单纯投缘更重要"
            : "吸引、稳定与承接需要一起看"
    },
    dimensions: [
      {
        key: "emotional",
        label: "情绪承接",
        score: Math.max(48, Math.min(92, 60 + (personA.strengthAnalysis.level === personB.strengthAnalysis.level ? 12 : 2)))
      },
      {
        key: "execution",
        label: "现实执行",
        score: Math.max(50, Math.min(94, 62 + (score >= 75 ? 14 : score >= 60 ? 6 : -2)))
      },
      {
        key: "rhythm",
        label: "节奏匹配",
        score: Math.max(45, Math.min(90, 58 + Math.abs(personA.strengthAnalysis.delta - personB.strengthAnalysis.delta) < 2 ? 12 : 0))
      }
    ]
  };
}

function buildCompatibilityMarketNarrative(relationType: CompatibilityRelationType) {
  if (relationType === "same-sex-couple") {
    return {
      headline: "看亲密，也看现实支撑",
      highlights: [
        "重点拆解情绪回应、关系安全感和长期经营压力。",
        "不是套用异性恋模板，而是看双方节奏、身份处境和现实承接。",
        "适合追问公开关系、同居、共同财务与长期稳定性。"
      ]
    };
  }

  if (relationType === "partner" || relationType === "colleague" || relationType === "boss-employee") {
    return {
      headline: "看投缘，更看能不能一起成事",
      highlights: [
        "重点拆解谁适合主资源、谁适合主执行、谁适合主对外。",
        "不仅看合作顺不顺，还看权责边界和风险点。",
        "适合追问签约、团队调整、共事磨损和决策机制。"
      ]
    };
  }

  return {
    headline: "看吸引，也看关系能不能落地",
    highlights: [
      "重点拆解舒服区、摩擦点和现实推进节奏。",
      "不仅看有没有感觉，也看能不能共同生活或长期相处。",
      "适合追问复合、推进、见家长、同居和关系定性。"
    ]
  };
}

function explainStrengthState(person: ReturnType<typeof analyzeBazi>) {
  if (person.strengthAnalysis.level === "strong") {
    return `此命局当前更偏旺，说明日主得令或得助较多，同类与印星力量更足，因此在关系里更容易表现出主动、承压或主导的一面。`;
  }
  if (person.strengthAnalysis.level === "weak") {
    return `此命局当前更偏弱，说明日主承压或耗泄较明显，需要印比扶助。关系里更需要安全感、稳定节奏和外部支持。`;
  }
  return `此命局整体偏中和，说明生扶与耗泄相对接近。关系里既能承接现实，也要注意阶段性起伏。`;
}

function explainElementContrast(
  element: WuXingName,
  aCount: number,
  bCount: number,
  personA: ReturnType<typeof analyzeBazi>,
  personB: ReturnType<typeof analyzeBazi>
) {
  if (aCount === bCount) {
    return `${element} 在双方盘面中的分布接近，说明这一部分的气场节奏比较同步。`;
  }

  const stronger = aCount > bCount ? "A" : "B";
  const strongerPerson = aCount > bCount ? personA : personB;
  const weakerPerson = aCount > bCount ? personB : personA;

  return `${element} 在 ${stronger} 一方更明显，这代表 ${stronger} 在对应的五行主题上更突出；如果这一项恰好是 ${strongerPerson.strengthAnalysis.favorableElements.map((item) => item.name).join("、")} 之一，就更容易形成优势输出；若对另一方属于忌神，则共处时要注意压制感。`;
}

function buildChartExplainItem(element: WuXingName, mode: "growth" | "friction"): ChartExplainItem {
  return {
    label: element,
    value: mode === "growth" ? 1 : -1,
    colorHex: WU_XING_COLORS[element].colorHex,
    colorName: WU_XING_COLORS[element].colorName,
    explanation:
      mode === "growth"
        ? `${element} 是双方更容易形成共同助力的部分，对应主题更适合一起建设。`
        : `${element} 是双方更容易失衡的部分，对应主题要特别注意节奏和边界。`
  };
}

function intersectElements(a: WuXingName[], b: WuXingName[]) {
  return uniqueElements(a.filter((item) => b.includes(item)));
}

function uniqueElements(items: WuXingName[]) {
  return [...new Set(items)];
}

function toElementSummary(name: WuXingName) {
  return {
    name,
    colorName: WU_XING_COLORS[name].colorName,
    colorHex: WU_XING_COLORS[name].colorHex
  };
}

function getRelationLabel(relationType: CompatibilityRelationType) {
  switch (relationType) {
    case "family":
      return "亲人合盘";
    case "parent-child":
      return "父母子女合盘";
    case "couple":
      return "情侣合盘";
    case "same-sex-couple":
      return "同性情侣合盘";
    case "colleague":
      return "同事合盘";
    case "boss-employee":
      return "老板与员工合盘";
    case "partner":
      return "合伙人合盘";
  }
}

function getComplementScore(
  personA: ReturnType<typeof analyzeBazi>,
  personB: ReturnType<typeof analyzeBazi>,
  sharedFavorable: WuXingName[]
) {
  let score = 60;

  if (personA.strengthAnalysis.level === personB.strengthAnalysis.level) {
    score += 8;
  }
  if (personA.dayMaster.wuxing === personB.dayMaster.wuxing) {
    score += 6;
  }
  score += sharedFavorable.length * 8;

  const aChallenges = personA.strengthAnalysis.unfavorableElements.map((item) => item.name as WuXingName);
  const bChallenges = personB.strengthAnalysis.unfavorableElements.map((item) => item.name as WuXingName);
  const sharedChallenges = intersectElements(aChallenges, bChallenges);
  score -= sharedChallenges.length * 5;

  return Math.max(35, Math.min(95, score));
}

function getCompatibilityLevel(score: number) {
  if (score >= 85) {
    return "高度协调";
  }
  if (score >= 72) {
    return "较为协调";
  }
  if (score >= 60) {
    return "可磨合发展";
  }
  return "需要刻意经营";
}

function buildCompatibilityMessage(
  relationType: CompatibilityRelationType,
  score: number,
  sharedFavorable: WuXingName[],
  frictionElements: WuXingName[]
) {
  const shared = sharedFavorable.length > 0 ? `双方共同受益于${sharedFavorable.join("、")}之气。` : "双方喜用方向重叠不多，更需要靠后天磨合。";
  const friction = frictionElements.length > 0 ? `共处时要注意${frictionElements.join("、")}失衡引发的节奏问题。` : "双方显性冲突点不重，重点在保持稳定互动。";

  if (relationType === "same-sex-couple") {
    return `${shared} 这类关系更看情绪承接、身份理解与长期节奏一致性。${friction}`;
  }

  if (relationType === "partner" || relationType === "colleague" || relationType === "boss-employee") {
    return `${shared} 这组关系在共事上更看分工、边界、责任与资源承接。${friction}`;
  }

  return score >= 72 ? `${shared} 整体合盘基础较好，关系推进更容易形成正循环。${friction}` : `${shared} 关系能否长久更依赖沟通和规则。${friction}`;
}

function buildSynergyBlock(
  mode: "emotional" | "collaboration" | "rhythm",
  relationType: CompatibilityRelationType,
  personA: ReturnType<typeof analyzeBazi>,
  personB: ReturnType<typeof analyzeBazi>,
  sharedFavorable: WuXingName[],
  frictionElements: WuXingName[]
) {
  if (mode === "emotional") {
    return {
      title: "情绪互动",
      resonance: [
        `A 为${personA.dayMaster.label}，B 为${personB.dayMaster.label}，双方在情绪表现上有各自节奏。`,
        sharedFavorable.length > 0 ? `双方较容易在${sharedFavorable.join("、")}对应的生活方式中找到舒适感。` : "双方需要通过具体生活安排建立安全感。"
      ],
      caution: frictionElements.length > 0 ? `当${frictionElements.join("、")}之气过重时，更容易在表达方式上出现误解。` : "情绪层面主要注意日常节奏不要失衡。",
      suggestion: relationType === "same-sex-couple"
        ? "更适合建立高质量沟通、公开边界和长期支持机制。"
        : "先处理表达方式，再处理具体分歧。"
    };
  }

  if (mode === "collaboration") {
    return {
      title: "共事协同",
      resonance: [
        `双方在${sharedFavorable.length > 0 ? sharedFavorable.join("、") : "互补分工"}方向更容易形成合作效率。`,
        personA.strengthAnalysis.level !== personB.strengthAnalysis.level
          ? "一强一弱的结构更适合分成决策端与执行端。"
          : "双方强弱接近时，更适合平行共担与定期复盘。"
      ],
      caution: "共事关系最怕边界不清、权责不明、情绪进入决策。",
      suggestion:
        relationType === "partner" || relationType === "colleague" || relationType === "boss-employee"
          ? "建议把角色、收益、决策权限和退出机制前置写清。"
          : "涉及共同事务时，建议明确谁主导、谁补位。"
    };
  }

  return {
    title: "相处节奏",
    resonance: [
      `当前年份下，A 与 B 都会受到各自流年流月节奏影响。`,
      "只要双方知道彼此高耗期和高能期，相处体验会明显更稳。"
    ],
    caution: "不要在双方都处于高压月时做重大关系决策。",
    suggestion: "重要沟通、合作推进、关系升级，建议避开双方都偏压的流月。"
  };
}

function buildCompatibilityPremium(input: {
  relationType: CompatibilityRelationType;
  isVip: boolean;
  personA: ReturnType<typeof analyzeBazi>;
  personB: ReturnType<typeof analyzeBazi>;
  sharedFavorable: WuXingName[];
  frictionElements: WuXingName[];
  complementScore: number;
}) {
  if (!input.isVip) {
    return {
      unlocked: false as const,
      vipRequired: true as const,
      preview: {
        core: "可解锁双方喜忌、旺衰互补与长期相处主线。",
        relationSpecial: input.relationType === "same-sex-couple"
          ? "可解锁同性情侣专项：亲密模式、现实压力与长期经营提醒。"
          : input.relationType === "partner" || input.relationType === "colleague" || input.relationType === "boss-employee"
            ? "可解锁共事专项：权责分工、资源协同与合作风险。"
            : "可解锁关系专项：互动优势、冲突来源与经营建议。"
      },
      upsellMessage: "开通 VIP 后可查看完整八字合盘深度分析。"
    };
  }

  const core = buildCoreCompatibilitySection(input);
  const special = buildRelationSpecificSection(input);

  return {
    unlocked: true as const,
    vipRequired: true as const,
    sections: {
      core,
      special
    }
  };
}

function buildCoreCompatibilitySection(input: {
  relationType: CompatibilityRelationType;
  personA: ReturnType<typeof analyzeBazi>;
  personB: ReturnType<typeof analyzeBazi>;
  sharedFavorable: WuXingName[];
  frictionElements: WuXingName[];
  complementScore: number;
}): PremiumSection {
  return {
    title: "合盘核心分析",
    summary: `当前合盘协调度为 ${input.complementScore} 分。双方共同受益方向偏向${input.sharedFavorable.length > 0 ? input.sharedFavorable.join("、") : "后天经营与规则"}，而${input.frictionElements.join("、")}失衡时更容易成为摩擦源。`,
    strengths: [
      `A 的${input.personA.dayMaster.label}与 B 的${input.personB.dayMaster.label}能形成一定互补参考。`,
      input.sharedFavorable.length > 0 ? `双方共同喜用${input.sharedFavorable.join("、")}时，更容易在生活或合作中形成正反馈。` : "虽然共同喜用不多，但并不代表不能长期发展，关键在规则与边界。"
    ],
    risks: [
      "合盘并不只看吸引力，更看双方是否能承接彼此节奏。",
      input.frictionElements.length > 0 ? `当${input.frictionElements.join("、")}对应的问题被放大时，关系更容易进入内耗。` : "显性冲突不强，但仍需避免长期忽视沟通。"
    ],
    suggestions: [
      "重要关系不只看感觉，更要看资源匹配与现实节奏是否一致。",
      "可以根据双方流年流月状态安排重要沟通、合作推进或关系升级。",
      "一旦进入冲突期，先调节节奏和表达方式，再处理事件本身。"
    ],
    vipOnly: true
  };
}

function buildRelationSpecificSection(input: {
  relationType: CompatibilityRelationType;
  personA: ReturnType<typeof analyzeBazi>;
  personB: ReturnType<typeof analyzeBazi>;
  sharedFavorable: WuXingName[];
  frictionElements: WuXingName[];
  complementScore: number;
}): PremiumSection {
  if (input.relationType === "same-sex-couple") {
    return {
      title: "同性情侣专项",
      summary: "这类关系比传统异性模板更需要看双方在情绪承接、现实支持、身份理解和长期节奏上的匹配度，而不是只套用婚恋公式。",
      strengths: [
        "如果双方在喜用方向和生活节奏上有重合，关系黏性通常会更强。",
        "更容易通过高质量沟通、共同成长和精神支持建立稳定连接。"
      ],
      risks: [
        "若现实压力、边界问题或安全感来源不一致，关系耗损会更明显。",
        "其中一方若长期处在高压流年，而另一方缺少理解与托举，容易形成隐性失衡。"
      ],
      suggestions: [
        "建议重点经营公开边界、情绪回应方式、未来规划与现实支持体系。",
        "不要只判断有没有爱，也要判断双方是否能持续承接彼此。 ",
        "遇到推进同居、公开关系、共同财务等阶段时，最好结合双方流月择时。"
      ],
      vipOnly: true
    };
  }

  if (input.relationType === "partner" || input.relationType === "colleague" || input.relationType === "boss-employee") {
    return {
      title: "共事专项",
      summary: "共事合盘核心不是看合不合得来，而是看谁适合定方向、谁适合承执行、谁适合控节奏，以及双方能否承接现实责任。",
      strengths: [
        "如果双方喜用方向有重合，更容易形成稳定合作框架。",
        "强弱不一的组合，在分工明确时往往比完全相同的组合更有效率。"
      ],
      risks: [
        "合盘里最常见的问题不是能力不足，而是角色混乱、边界模糊、决策权不清。",
        "当共同忌神被现实事务放大时，容易出现互相消耗、推责或节奏失控。"
      ],
      suggestions: [
        "建议明确分工：谁主资源、谁主执行、谁主对外、谁主风控。",
        "涉及收益、权责、退出机制、决策流程时，最好在合作早期就写清。",
        "重要签约、合作扩张、团队调整，可结合双方流年流月选更顺势的时间点。"
      ],
      vipOnly: true
    };
  }

  if (input.relationType === "parent-child" || input.relationType === "family") {
    return {
      title: "亲缘关系专项",
      summary: "亲缘合盘更看教育方式、互动边界和长期支持，而不是单纯看谁压谁。相处舒服往往来源于节奏理解与角色清晰。",
      strengths: [
        "如果双方在喜用方向上有重叠，家庭氛围更容易形成稳定支持。",
        "一强一弱的结构，在边界明确时反而更适合形成照顾与托举。"
      ],
      risks: [
        "最怕的是爱很多、方式却总错位，导致付出和感受不对等。",
        "一方高压期强行要求另一方配合，容易积累长期情绪问题。"
      ],
      suggestions: [
        "建议把理解放在控制前，把支持放在指责前。",
        "家庭重大安排、教育风格、照护责任最好做出稳定分工。",
        "如需处理长期关系卡点，可结合双方流月高耗期做避让。"
      ],
      vipOnly: true
    };
  }

  return {
    title: "情侣关系专项",
    summary: "情侣合盘重点看吸引、稳定、现实承接与关系节奏是否同步。真正适合长期的关系，往往是既有感觉又能共同生活。",
    strengths: [
      "若双方共同喜用方向较多，关系更容易形成舒适区和共同目标。",
      "流年流月协调时，关系推进、确认与共同规划会更顺。"
    ],
    risks: [
      "只靠热情不靠承接，关系容易在现实阶段掉速。",
      "若双方共同忌神被激活，容易出现争执、逃避、拉扯或不安全感。"
    ],
    suggestions: [
      "重要阶段如表白、复合、见家长、同居、共同财务，建议结合流月选时。",
      "关系里要同时看情绪价值和现实执行力。",
      "当冲突发生时，先看谁处在高耗期，再决定怎么沟通。"
    ],
    vipOnly: true
  };
}

function buildPremiumAnalysis(input: {
  pillars: PillarVisual[];
  strengthLevel: StrengthLevel;
  dayMaster: WuXingName;
  favorableElements: WuXingName[];
  unfavorableElements: WuXingName[];
  flowAnalysis: ReturnType<typeof getCurrentDaYunDetail>;
  isVip: boolean;
}) {
  const locked = {
    unlocked: false as const,
    vipRequired: true as const,
    preview: {
      career: "可解锁事业方向、职业节奏与当前年份推进建议。",
      relationship: "可解锁情感模式、相处节奏与当前年份关系提醒。",
      wealth: "可解锁财运结构、求财节奏与风险提醒。",
      health: "可解锁身心耗能点、作息与养护方向。"
    },
    upsellMessage: "开通 VIP 后可查看八字专项深度解读。"
  };

  if (!input.isVip) {
    return locked;
  }

  const { pillars, strengthLevel, dayMaster, favorableElements, unfavorableElements, flowAnalysis } = input;
  const currentYearFavorability =
    flowAnalysis.supported && flowAnalysis.currentLiuNian
      ? flowAnalysis.currentLiuNian.flowInsight.favorability
      : "neutral";
  const currentLuckFavorability =
    flowAnalysis.supported && flowAnalysis.currentDaYun
      ? flowAnalysis.currentDaYun.flowInsight.favorability
      : "neutral";
  const monthStem = pillars[1].heavenlyStem.wuxing;
  const monthBranch = pillars[1].earthlyBranch.wuxing;

  const career = buildCareerSection(
    strengthLevel,
    dayMaster,
    favorableElements,
    currentYearFavorability,
    currentLuckFavorability
  );
  const relationship = buildRelationshipSection(
    strengthLevel,
    pillars,
    favorableElements,
    unfavorableElements,
    currentYearFavorability
  );
  const wealth = buildWealthSection(
    strengthLevel,
    favorableElements,
    unfavorableElements,
    currentYearFavorability,
    currentLuckFavorability
  );
  const health = buildHealthSection(
    strengthLevel,
    dayMaster,
    monthStem,
    monthBranch,
    unfavorableElements
  );

  return {
    unlocked: true as const,
    vipRequired: true as const,
    sections: {
      career,
      relationship,
      wealth,
      health
    }
  };
}

function buildCareerSection(
  strengthLevel: StrengthLevel,
  dayMaster: WuXingName,
  favorableElements: WuXingName[],
  currentYearFavorability: "favorable" | "neutral" | "challenging",
  currentLuckFavorability: "favorable" | "neutral" | "challenging"
): PremiumSection {
  const executionStyle =
    strengthLevel === "weak"
      ? "先稳根基、后争机会"
      : strengthLevel === "strong"
        ? "适合主动输出与承担项目"
        : "可在稳中求进里做节奏型突破";

  return {
    title: "事业专项",
    summary: `日主${strengthLevel === "weak" ? "偏弱" : strengthLevel === "strong" ? "偏旺" : "较平"}，事业上更适合${executionStyle}。当前喜用偏向${favorableElements.join("、")}，适合围绕这些五行象意选择环境与合作方式。`,
    strengths: [
      `当前命局对${favorableElements.join("、")}类事务更容易形成正反馈。`,
      `日主为${dayMaster}，做事节奏宜讲究阶段性蓄力与稳定输出。`,
      currentLuckFavorability === "favorable"
        ? "当前大运对事业推进较友好，适合逐步扩张责任边界。"
        : "当前大运更强调节奏控制，适合边做边修正。"
    ],
    risks: [
      currentYearFavorability === "challenging"
        ? "今年事业上容易出现外部压力或目标过满，忌硬顶节奏。"
        : "事业上的主要风险不在机会不足，而在节奏判断失误。",
      strengthLevel === "weak"
        ? "命局偏弱时，不宜同时扛过多事务线。"
        : "命局不宜在高压期长期单点透支。"
    ],
    suggestions: [
      "优先选择可以持续积累的岗位、项目或合作关系。",
      "遇到关键决策时，先看资源匹配度，再看表面机会大小。",
      "若要转岗、创业或换赛道，建议结合当前流年流月择时推进。 "
    ],
    vipOnly: true
  };
}

function buildRelationshipSection(
  strengthLevel: StrengthLevel,
  pillars: PillarVisual[],
  favorableElements: WuXingName[],
  unfavorableElements: WuXingName[],
  currentYearFavorability: "favorable" | "neutral" | "challenging"
): PremiumSection {
  const dayBranch = pillars[2].earthlyBranch.wuxing;
  const hourBranch = pillars[3].earthlyBranch.wuxing;

  return {
    title: "情感专项",
    summary: `情感模式更受日支${dayBranch}与时支${hourBranch}气息影响。命局当前偏${strengthLevel === "weak" ? "需要被理解和托举" : strengthLevel === "strong" ? "需要空间与节奏感" : "重视稳定互动"}，关系发展宜顺着${favorableElements.join("、")}类能量去经营。`,
    strengths: [
      "适合通过长期互动、共同节奏、现实支持来建立关系安全感。",
      currentYearFavorability === "favorable"
        ? "当前流年对关系推进较友好，适合明确关系定位。"
        : "当前流年更适合观察与磨合，而不是过快定论。"
    ],
    risks: [
      `命局对${unfavorableElements.join("、")}类失衡时，容易在情感中出现误解、拉扯或压迫感。`,
      strengthLevel === "weak"
        ? "偏弱命局在关系里要防止过度迁就。"
        : "偏旺命局在关系里要防止控制感或节奏过强。"
    ],
    suggestions: [
      "重要关系里先处理沟通方式，再处理立场分歧。",
      "如果处于暧昧或观察阶段，更适合看持续性而非一时热度。",
      "涉及复合、推进、见家长等节奏，建议结合流月吉凶再落点。"
    ],
    vipOnly: true
  };
}

function buildWealthSection(
  strengthLevel: StrengthLevel,
  favorableElements: WuXingName[],
  unfavorableElements: WuXingName[],
  currentYearFavorability: "favorable" | "neutral" | "challenging",
  currentLuckFavorability: "favorable" | "neutral" | "challenging"
): PremiumSection {
  return {
    title: "财运专项",
    summary: `财运更看命局能否承财与守财。当前命局对${favorableElements.join("、")}方向更容易形成正向循环，对${unfavorableElements.join("、")}过重时则更容易出现资金消耗或判断偏差。`,
    strengths: [
      currentLuckFavorability === "favorable"
        ? "当前大运具备一定的资源承接空间，适合做稳健增量。"
        : "当前大运更适合先打基础、理现金流，再谈放大收益。",
      strengthLevel === "weak"
        ? "偏弱命局更适合用组织、合作、制度来承财。"
        : "偏旺命局更适合把能力输出转成持续收益。"
    ],
    risks: [
      currentYearFavorability === "challenging"
        ? "当前流年不宜激进投机、重仓冒险或情绪化消费。"
        : "财运上主要防范的是节奏错配，而不是完全没有机会。",
      "求财宜看可持续回报，不宜只看短期刺激。"
    ],
    suggestions: [
      "优先做现金流稳定、周期清晰的收入布局。",
      "大额投资、合作分账、借贷往来建议择时并保留边界。",
      "适合把财富策略分成保守盘、增长盘、机会盘三层管理。"
    ],
    vipOnly: true
  };
}

function buildHealthSection(
  strengthLevel: StrengthLevel,
  dayMaster: WuXingName,
  monthStem: WuXingName,
  monthBranch: WuXingName,
  unfavorableElements: WuXingName[]
): PremiumSection {
  return {
    title: "健康专项",
    summary: `健康分析以五行失衡和季节耗能为主。日主属${dayMaster}，月干月支呈现${monthStem}/${monthBranch}之气，说明身心状态容易受时令与作息波动影响。`,
    strengths: [
      "只要作息稳定、情绪稳定，整体恢复能力通常不差。",
      strengthLevel === "weak"
        ? "偏弱命局更需要规律补养与减少透支。"
        : "偏旺或中和命局更需要避免火力过强后的反向消耗。"
    ],
    risks: [
      `当${unfavorableElements.join("、")}之气过重时，更容易出现疲惫、烦躁、内耗或代谢失衡感。`,
      "长期熬夜、情绪压抑、饮食失衡会放大命局原本的薄弱点。"
    ],
    suggestions: [
      "优先保证睡眠与稳定作息，健康调理比短期猛补更重要。",
      "饮食、运动、情绪调节都建议按季节做微调，不宜忽冷忽热。",
      "若某阶段明显状态下滑，可结合流月判断高耗期并提前减压。"
    ],
    vipOnly: true
  };
}
