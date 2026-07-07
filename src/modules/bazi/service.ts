import { Lunar, Solar } from "lunar-typescript";
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
  const dateMatch = birthDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
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

function getDaYunSummary(lunar: Lunar, gender: Gender) {
  if (gender === "other") {
    return {
      supported: false,
      note: "当前大运顺逆排法首版仅按男/女传统规则输出。"
    };
  }

  const yun = lunar.getEightChar().getYun(gender === "male" ? 1 : 0);
  const daYun = yun
    .getDaYun(8)
    .map((item) => ({
      index: item.getIndex(),
      ganzhi: item.getGanZhi(),
      startYear: item.getStartYear(),
      endYear: item.getEndYear(),
      startAge: item.getStartAge(),
      endAge: item.getEndAge(),
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
  const relation = `${getElementRelation(dayMaster, gan.wuxing)} / ${getElementRelation(dayMaster, zhi.wuxing)}`;
  const score =
    (favorableElements.includes(gan.wuxing) ? 1 : 0) +
    (favorableElements.includes(zhi.wuxing) ? 1 : 0) -
    (unfavorableElements.includes(gan.wuxing) ? 1 : 0) -
    (unfavorableElements.includes(zhi.wuxing) ? 1 : 0);

  const favorability: "favorable" | "neutral" | "challenging" =
    score > 0 ? "favorable" : score < 0 ? "challenging" : "neutral";

  return {
    ganzhi,
    gan,
    zhi,
    relationToDayMaster: relation,
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
  const daYunList = yun
    .getDaYun(8)
    .filter((item) => item.getGanZhi())
    .map((item) => ({
      index: item.getIndex(),
      ganzhi: item.getGanZhi(),
      startYear: item.getStartYear(),
      endYear: item.getEndYear(),
      startAge: item.getStartAge(),
      endAge: item.getEndAge(),
      flowInsight: buildFlowInsight(item.getGanZhi(), dayMaster, favorableElements, unfavorableElements),
      raw: item
    }));

  const currentDaYun = daYunList.find((item) => focusYear >= item.startYear && focusYear <= item.endYear) ?? daYunList[0];
  const liuNian = currentDaYun.raw
    .getLiuNian()
    .map((item) => ({
      year: item.getYear(),
      age: item.getAge(),
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
    flowInsight: buildFlowInsight(item.getGanZhi(), dayMaster, favorableElements, unfavorableElements)
  }));

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
      flowInsight: currentDaYun.flowInsight
    },
    currentLiuNian: {
      year: currentLiuNian.year,
      age: currentLiuNian.age,
      ganzhi: currentLiuNian.ganzhi,
      xunKong: currentLiuNian.xunKong,
      flowInsight: currentLiuNian.flowInsight
    },
    liuNianTimeline: liuNian
      .filter((item) => item.year >= focusYear - 2 && item.year <= focusYear + 2)
      .map((item) => ({
        year: item.year,
        age: item.age,
        ganzhi: item.ganzhi,
        xunKong: item.xunKong,
        flowInsight: item.flowInsight
      })),
    liuYue
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
  const daYun = getDaYunSummary(lunar, input.gender);
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
    premiumAnalysis,
    daYun,
    flowAnalysis
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
