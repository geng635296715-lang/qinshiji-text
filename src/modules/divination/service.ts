import { Solar } from "lunar-typescript";
import type { DivinationTopic } from "../../shared/types/domain.js";

type LiuyaoLineType = "old-yin" | "young-yang" | "young-yin" | "old-yang";
type TrigramKey = "qian" | "dui" | "li" | "zhen" | "xun" | "kan" | "gen" | "kun";
type WuXing = "木" | "火" | "土" | "金" | "水";

type LiuyaoInput = {
  topic: DivinationTopic;
  title: string;
  description?: string;
  castingMode: "auto" | "manual";
  occurredAt?: string;
  lines?: LiuyaoLineType[];
};

type MeihuaInput = {
  topic: DivinationTopic;
  title: string;
  description?: string;
  castingMode: "numbers" | "time";
  timeMethod?: "ymd" | "ymdh" | "ymdhm" | "lunar-ymdh";
  numbers?: number[];
  occurredAt?: string;
  externalOmen?: {
    direction?: string;
    sound?: string;
    color?: string;
    motion?: string;
    countNumber?: number;
    touchedObject?: string;
    scene?: string;
  };
};

type TrigramMeta = {
  key: TrigramKey;
  name: string;
  symbol: string;
  lines: [number, number, number];
  element: WuXing;
  direction: string;
  image: string;
  attribute: string;
};

type HexagramMeta = {
  name: string;
  palace: string;
  keywords: string[];
  judgment: string;
  image: string;
};

type TopicGuidance = {
  scene: string;
  currentFocus: string;
  favorableAction: string;
  caution: string;
  timelineHint: string;
  ifAskingResult: string;
  searchAdvice?: {
    likelyDirections: string[];
    likelyZones: string[];
    searchOrder: string[];
  };
};

type DivinationTimeContext = {
  occurredAt: string;
  solar: string;
  lunar: string;
  jieQi: string | null;
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  hourGanzhi: string;
  monthBuild: string;
  dayBuild: string;
  monthElement: WuXing;
  dayElement: WuXing;
};

const LIUYAO_LINE_MAP: Record<
  LiuyaoLineType,
  { value: 0 | 1; changing: boolean; label: string; code: 6 | 7 | 8 | 9 }
> = {
  "old-yin": { value: 0, changing: true, label: "老阴", code: 6 },
  "young-yang": { value: 1, changing: false, label: "少阳", code: 7 },
  "young-yin": { value: 0, changing: false, label: "少阴", code: 8 },
  "old-yang": { value: 1, changing: true, label: "老阳", code: 9 }
};

const TOPIC_LABELS: Record<DivinationTopic, string> = {
  love: "情感",
  career: "事业",
  wealth: "财运",
  health: "健康",
  travel: "出行",
  "missing-item": "寻物",
  decision: "决断",
  relationship: "关系",
  other: "其他"
};

const TRIGRAMS: TrigramMeta[] = [
  { key: "qian", name: "乾", symbol: "☰", lines: [1, 1, 1], element: "金", direction: "西北", image: "天", attribute: "健" },
  { key: "dui", name: "兑", symbol: "☱", lines: [1, 1, 0], element: "金", direction: "正西", image: "泽", attribute: "悦" },
  { key: "li", name: "离", symbol: "☲", lines: [1, 0, 1], element: "火", direction: "正南", image: "火", attribute: "明" },
  { key: "zhen", name: "震", symbol: "☳", lines: [1, 0, 0], element: "木", direction: "正东", image: "雷", attribute: "动" },
  { key: "xun", name: "巽", symbol: "☴", lines: [0, 1, 1], element: "木", direction: "东南", image: "风", attribute: "入" },
  { key: "kan", name: "坎", symbol: "☵", lines: [0, 1, 0], element: "水", direction: "正北", image: "水", attribute: "险" },
  { key: "gen", name: "艮", symbol: "☶", lines: [0, 0, 1], element: "土", direction: "东北", image: "山", attribute: "止" },
  { key: "kun", name: "坤", symbol: "☷", lines: [0, 0, 0], element: "土", direction: "西南", image: "地", attribute: "顺" }
];

const TRIGRAM_BY_LINES = Object.fromEntries(
  TRIGRAMS.map((item) => [item.lines.join(""), item])
) as Record<string, TrigramMeta>;

const HEXAGRAMS: Record<string, HexagramMeta> = {
  "qian-qian": { name: "乾为天", palace: "乾宫", keywords: ["主动", "开创", "刚健"], judgment: "宜主动把握，但忌过刚。", image: "天行健，宜以持续行动推动结果。" },
  "qian-dui": { name: "泽天夬", palace: "坤宫", keywords: ["决断", "去弊", "表态"], judgment: "宜明确立场，先定边界再推进。", image: "刚决而行，重在果断去滞。" },
  "qian-li": { name: "火天大有", palace: "乾宫", keywords: ["收获", "资源", "光明"], judgment: "利于整合资源，但要防骄满。", image: "有所得时，更要守住分寸。" },
  "qian-zhen": { name: "雷天大壮", palace: "坤宫", keywords: ["发力", "上升", "强势"], judgment: "能量足，宜顺势推进，勿硬碰硬。", image: "壮而有度，方可久长。" },
  "qian-xun": { name: "风天小畜", palace: "巽宫", keywords: ["蓄势", "积累", "等待"], judgment: "宜先蓄势，重在小步积累。", image: "未到全开之时，先收束资源。" },
  "qian-kan": { name: "水天需", palace: "坤宫", keywords: ["等待", "时机", "耐心"], judgment: "需等待更合适时点，不宜急推。", image: "有望但未熟，宜守时而动。" },
  "qian-gen": { name: "山天大畜", palace: "艮宫", keywords: ["储备", "约束", "沉淀"], judgment: "适合储备与内修，先厚积再外发。", image: "所蓄越厚，后势越稳。" },
  "qian-kun": { name: "地天泰", palace: "坤宫", keywords: ["通达", "顺畅", "和合"], judgment: "整体有利，适合沟通协作与推进。", image: "上下相交，事态多有转机。" },
  "dui-qian": { name: "天泽履", palace: "艮宫", keywords: ["谨慎", "礼法", "行事"], judgment: "宜按规矩前行，细节比速度更重要。", image: "如履薄冰，守礼则吉。" },
  "dui-dui": { name: "兑为泽", palace: "兑宫", keywords: ["沟通", "喜悦", "说服"], judgment: "利于表达与协商，忌只说不做。", image: "悦中有度，方能得人。" },
  "dui-li": { name: "火泽睽", palace: "艮宫", keywords: ["分歧", "对照", "异见"], judgment: "意见不一时，宜求小同，不宜强同。", image: "不同并存，关键在于找交集。" },
  "dui-zhen": { name: "雷泽归妹", palace: "兑宫", keywords: ["仓促", "情感", "配合"], judgment: "感情或合作不宜操之过急。", image: "关系推进需看时机与位置。" },
  "dui-xun": { name: "风泽中孚", palace: "艮宫", keywords: ["诚信", "信任", "内核"], judgment: "重在真诚与兑现，适合建立信任。", image: "诚意到了，事才会稳。" },
  "dui-kan": { name: "水泽节", palace: "坎宫", keywords: ["节制", "规则", "边界"], judgment: "宜设边界、控节奏，切忌过量。", image: "有节有度，方可长远。" },
  "dui-gen": { name: "山泽损", palace: "艮宫", keywords: ["取舍", "止损", "舍得"], judgment: "宜先减负与止损，再谈扩展。", image: "先减后增，反而更利长线。" },
  "dui-kun": { name: "地泽临", palace: "坤宫", keywords: ["接近", "掌控", "督导"], judgment: "利于靠近目标，但要防后劲不足。", image: "临近之时，更重持续经营。" },
  "li-qian": { name: "天火同人", palace: "离宫", keywords: ["合作", "同道", "外联"], judgment: "利于联结同道、结盟合作。", image: "志同道合，事更易成。" },
  "li-dui": { name: "泽火革", palace: "坎宫", keywords: ["变革", "更新", "切换"], judgment: "宜改旧立新，但要先统一口径。", image: "变化不是问题，时机才是关键。" },
  "li-li": { name: "离为火", palace: "离宫", keywords: ["显化", "名声", "看清"], judgment: "利于曝光与表达，但忌虚火。", image: "越明之时，越要防空耗。" },
  "li-zhen": { name: "雷火丰", palace: "坎宫", keywords: ["高峰", "繁盛", "过满"], judgment: "当下有势能，但勿过度铺张。", image: "盛极需防转折。" },
  "li-xun": { name: "风火家人", palace: "巽宫", keywords: ["秩序", "内务", "关系经营"], judgment: "重在内部秩序与角色分工。", image: "先安内，再对外。" },
  "li-kan": { name: "水火既济", palace: "坎宫", keywords: ["已成", "收尾", "精修"], judgment: "事情可成，但后段更要谨慎。", image: "功成之际，最怕松散。" },
  "li-gen": { name: "山火贲", palace: "艮宫", keywords: ["修饰", "包装", "形象"], judgment: "适合优化呈现，但内核不能空。", image: "外在可美，根基要实。" },
  "li-kun": { name: "地火明夷", palace: "坎宫", keywords: ["隐忍", "避锋", "护持"], judgment: "不宜高调，宜收光养晦。", image: "先护住自己，再等转机。" },
  "zhen-qian": { name: "天雷无妄", palace: "巽宫", keywords: ["真实", "顺势", "无妄"], judgment: "宜坦诚行动，忌投机取巧。", image: "心正则势顺。" },
  "zhen-dui": { name: "泽雷随", palace: "震宫", keywords: ["跟随", "顺势", "调整"], judgment: "适合跟势而动，不宜逆时强行。", image: "随时而动，变中求顺。" },
  "zhen-li": { name: "火雷噬嗑", palace: "巽宫", keywords: ["处理", "裁断", "清障"], judgment: "宜面对问题、快速处理障碍。", image: "该咬开的地方不要拖。" },
  "zhen-zhen": { name: "震为雷", palace: "震宫", keywords: ["突发", "启动", "惊动"], judgment: "事情动得快，先稳心再应对。", image: "震来有声，稳住则吉。" },
  "zhen-xun": { name: "风雷益", palace: "巽宫", keywords: ["增益", "扶持", "加码"], judgment: "适合加资源、拉支持、做增长。", image: "利他之中也有自益。" },
  "zhen-kan": { name: "水雷屯", palace: "坎宫", keywords: ["起步难", "萌芽", "摸索"], judgment: "起步期阻力较多，宜慢开局。", image: "难在开头，但不是无路。" },
  "zhen-gen": { name: "山雷颐", palace: "巽宫", keywords: ["养成", "口舌", "调养"], judgment: "重在修口与养成，忌言行失衡。", image: "先养好，再发力。" },
  "zhen-kun": { name: "地雷复", palace: "坤宫", keywords: ["回归", "复合", "重启"], judgment: "有回头与重启之象，适合修复。", image: "旧路未必不好，关键在新做法。" },
  "xun-qian": { name: "天风姤", palace: "乾宫", keywords: ["相遇", "偶发", "接触"], judgment: "有突然而来的机会或人物。", image: "相遇即起变，宜辨其长短。" },
  "xun-dui": { name: "泽风大过", palace: "震宫", keywords: ["过载", "压力", "承担"], judgment: "负担偏重，宜分担与减压。", image: "梁大则压大，不可久扛。" },
  "xun-li": { name: "火风鼎", palace: "离宫", keywords: ["升级", "重组", "转化"], judgment: "适合重组模式，完成升级。", image: "旧器可新用，重在火候。" },
  "xun-zhen": { name: "雷风恒", palace: "震宫", keywords: ["持续", "稳定", "长线"], judgment: "利于长期关系与持续经营。", image: "能久，方能成。" },
  "xun-xun": { name: "巽为风", palace: "巽宫", keywords: ["渗透", "商量", "进入"], judgment: "适合以柔入局，循序渐进。", image: "柔入而不硬碰，更易达成。" },
  "xun-kan": { name: "水风井", palace: "震宫", keywords: ["基础", "资源源头", "更新"], judgment: "宜修基础与底层资源。", image: "井在，关键在是否汲取得法。" },
  "xun-gen": { name: "山风蛊", palace: "巽宫", keywords: ["整顿", "修正", "治理"], judgment: "适合纠偏整顿，不宜回避旧问题。", image: "旧乱不理，新局难立。" },
  "xun-kun": { name: "地风升", palace: "震宫", keywords: ["上升", "渐进", "被看见"], judgment: "适合稳步上升，忌急于求成。", image: "升有阶次，不可跳级。" },
  "kan-qian": { name: "天水讼", palace: "离宫", keywords: ["争议", "对立", "博弈"], judgment: "不宜硬刚，先明利害与证据。", image: "有争即耗，求解不求激。" },
  "kan-dui": { name: "泽水困", palace: "兑宫", keywords: ["受限", "卡顿", "资源紧"], judgment: "短期受限，宜守住核心。", image: "困中求变，先活下来。" },
  "kan-li": { name: "火水未济", palace: "离宫", keywords: ["未成", "未稳", "收尾难"], judgment: "尚未定局，宜继续补最后一段。", image: "眼看将成，更要收住节奏。" },
  "kan-zhen": { name: "雷水解", palace: "震宫", keywords: ["化解", "释放", "转松"], judgment: "问题有解，但需找到开口。", image: "解在行动，不在空等。" },
  "kan-xun": { name: "风水涣", palace: "离宫", keywords: ["分散", "疏导", "离心"], judgment: "适合疏导与化散，不宜强聚。", image: "先化郁，再谈重整。" },
  "kan-kan": { name: "坎为水", palace: "坎宫", keywords: ["风险", "反复", "谨慎"], judgment: "风险偏高，宜守不宜躁。", image: "险中求稳，比求快更重要。" },
  "kan-gen": { name: "山水蒙", palace: "离宫", keywords: ["迷茫", "学习", "启蒙"], judgment: "信息不全，先问清再决定。", image: "蒙不是错，乱动才是错。" },
  "kan-kun": { name: "地水师", palace: "坎宫", keywords: ["组织", "队伍", "纪律"], judgment: "适合带团队、立规则、整队形。", image: "众力可用，先明号令。" },
  "gen-qian": { name: "天山遁", palace: "乾宫", keywords: ["退守", "抽离", "保存"], judgment: "宜退一步布防，不宜硬撑。", image: "退不是输，是换位保全。" },
  "gen-dui": { name: "泽山咸", palace: "兑宫", keywords: ["感应", "吸引", "互动"], judgment: "关系有感应，重在回应质量。", image: "彼此有动，顺势沟通更佳。" },
  "gen-li": { name: "火山旅", palace: "离宫", keywords: ["漂移", "外出", "临时"], judgment: "适合短期行动，不宜过度定局。", image: "旅途中更看适应力。" },
  "gen-zhen": { name: "雷山小过", palace: "兑宫", keywords: ["小步", "谨慎", "微调"], judgment: "宜小处调整，不宜大跨步。", image: "过一点点即可，不可过火。" },
  "gen-xun": { name: "风山渐", palace: "艮宫", keywords: ["渐进", "婚恋", "积累"], judgment: "慢慢来更有利，适合稳步培养。", image: "渐而成势，最怕急躁。" },
  "gen-kan": { name: "水山蹇", palace: "兑宫", keywords: ["阻滞", "绕路", "求援"], judgment: "前路有阻，宜换法或借力。", image: "蹇时求援，比死扛明智。" },
  "gen-gen": { name: "艮为山", palace: "艮宫", keywords: ["停止", "边界", "沉住"], judgment: "宜止、宜定、宜收，不宜乱动。", image: "止得住，才看得清。" },
  "gen-kun": { name: "地山谦", palace: "兑宫", keywords: ["谦和", "积德", "收敛"], judgment: "谦则有益，适合低姿态推进。", image: "越有实力，越宜藏锋。" },
  "kun-qian": { name: "天地否", palace: "乾宫", keywords: ["闭塞", "不通", "等待"], judgment: "眼下不算顺，宜保守与观察。", image: "否极未至泰前，先稳局。" },
  "kun-dui": { name: "泽地萃", palace: "坤宫", keywords: ["聚集", "汇合", "资源集中"], judgment: "适合聚人聚事，但要明确中心。", image: "聚则强，乱聚则散。" },
  "kun-li": { name: "火地晋", palace: "乾宫", keywords: ["晋升", "推进", "被看到"], judgment: "利于上升与展示，宜主动争取。", image: "进有光，但要守节奏。" },
  "kun-zhen": { name: "雷地豫", palace: "震宫", keywords: ["预备", "舒展", "先乐后行"], judgment: "氛围转松，适合预备与暖场。", image: "豫则能行，过逸则散。" },
  "kun-xun": { name: "风地观", palace: "乾宫", keywords: ["观察", "看势", "远观"], judgment: "先看局势与人心，不宜马上定论。", image: "看得越清，动得越准。" },
  "kun-kan": { name: "地水比", palace: "坤宫", keywords: ["靠拢", "联盟", "依附"], judgment: "利于结伴协力，但要辨可靠性。", image: "比而有择，才是真助力。" },
  "kun-gen": { name: "山地剥", palace: "乾宫", keywords: ["剥落", "收缩", "退守"], judgment: "不利扩张，宜减负与自保。", image: "先止损，后求新生。" },
  "kun-kun": { name: "坤为地", palace: "坤宫", keywords: ["承载", "顺势", "厚重"], judgment: "宜配合大势、稳扎稳打。", image: "以柔承载，厚积成势。" }
};

const LINE_POSITION_MEANINGS = [
  "初爻主起念与开端，重在判断这件事值不值得开局。",
  "二爻主配合与支撑，重在看身边资源、人和条件够不够。",
  "三爻主进退与摩擦，往往是最容易出现犹疑或卡点的位置。",
  "四爻主临门与外部关系，常对应机会来到但要求更高。",
  "五爻主核心决断与主导权，往往是事情成败关键处。",
  "上爻主结果与收尾，也提醒过满、过急或尾段失衡。"
];

const ELEMENT_WOOD = TRIGRAMS.find((item) => item.key === "zhen")!.element;
const ELEMENT_FIRE = TRIGRAMS.find((item) => item.key === "li")!.element;
const ELEMENT_EARTH = TRIGRAMS.find((item) => item.key === "kun")!.element;
const ELEMENT_METAL = TRIGRAMS.find((item) => item.key === "qian")!.element;
const ELEMENT_WATER = TRIGRAMS.find((item) => item.key === "kan")!.element;

function getBranchElement(branch: string): WuXing {
  if (["瀵?", "鍗?"].includes(branch)) return ELEMENT_WOOD;
  if (["宸?", "鍗?"].includes(branch)) return ELEMENT_FIRE;
  if (["鐢?", "閰?"].includes(branch)) return ELEMENT_METAL;
  if (["瀛?", "浜?"].includes(branch)) return ELEMENT_WATER;
  return ELEMENT_EARTH;
}

function getStemElement(stem: string): WuXing {
  if (["鐢?", "涔?"].includes(stem)) return ELEMENT_WOOD;
  if (["涓?", "涓?"].includes(stem)) return ELEMENT_FIRE;
  if (["搴?", "杈?"].includes(stem)) return ELEMENT_METAL;
  if (["澹?", "鐧?"].includes(stem)) return ELEMENT_WATER;
  return ELEMENT_EARTH;
}

const SIX_SPIRITS = ["闈掗緳", "鏈遍泙", "鍕鹃檲", "鑵捐泧", "鐧借檸", "鐜勬"];

function getSixSpiritStart(dayStem: string) {
  if (["鐢?", "涔?"].includes(dayStem)) return 0;
  if (["涓?", "涓?"].includes(dayStem)) return 1;
  if (dayStem === "鎴?") return 2;
  if (dayStem === "宸?") return 3;
  if (["搴?", "杈?"].includes(dayStem)) return 4;
  return 5;
}

const NAJIA_LOWER_STEM: Record<TrigramKey, string> = {
  qian: "鐢?",
  dui: "涓?",
  li: "宸?",
  zhen: "搴?",
  xun: "杈?",
  kan: "鎴?",
  gen: "涓?",
  kun: "涔?"
};

const NAJIA_UPPER_STEM: Record<TrigramKey, string> = {
  qian: "澹?",
  dui: "涓?",
  li: "宸?",
  zhen: "搴?",
  xun: "杈?",
  kan: "鎴?",
  gen: "涓?",
  kun: "鐧?"
};

const NAJIA_BRANCHES: Record<TrigramKey, [string, string, string]> = {
  qian: ["瀛?", "瀵?", "杈?"],
  dui: ["宸?", "鍗?", "涓?"],
  li: ["鍗?", "涓?", "浜?"],
  zhen: ["瀛?", "瀵?", "杈?"],
  xun: ["涓?", "浜?", "閰?"],
  kan: ["瀵?", "杈?", "鍗?"],
  gen: ["杈?", "鍗?", "鐢?"],
  kun: ["鏈?", "宸?", "鍗?"]
};

const SHI_YING_BY_TRIGRAM: Record<TrigramKey, { shi: number; ying: number }> = {
  qian: { shi: 6, ying: 3 },
  dui: { shi: 5, ying: 2 },
  li: { shi: 4, ying: 1 },
  zhen: { shi: 3, ying: 6 },
  xun: { shi: 2, ying: 5 },
  kan: { shi: 1, ying: 4 },
  gen: { shi: 4, ying: 1 },
  kun: { shi: 3, ying: 6 }
};

function normalizeMod(value: number, base: number) {
  const mod = value % base;
  return mod === 0 ? base : mod;
}

function getTrigramByNumber(value: number): TrigramMeta {
  const normalized = normalizeMod(Math.abs(value), 8);
  return TRIGRAMS[normalized - 1];
}

function getTrigramByLines(lines: [number, number, number]) {
  return TRIGRAM_BY_LINES[lines.join("")];
}

function getHexagramMeta(lower: TrigramMeta, upper: TrigramMeta): HexagramMeta {
  return HEXAGRAMS[`${lower.key}-${upper.key}`];
}

function getSolarFromOccurredAt(occurredAt?: string) {
  const date = occurredAt ? new Date(occurredAt) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error("occurredAt must be a valid date string");
  }

  return Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}

function getElementFromGanzhi(ganzhi: string): WuXing {
  const branch = ganzhi.charAt(1);
  return getBranchElement(branch) ?? getStemElement(ganzhi.charAt(0)) ?? ELEMENT_EARTH;
}

function getRelationLabel(dayElement: WuXing, targetElement: WuXing) {
  if (dayElement === targetElement) {
    return "鍏勫紵";
  }

  const generates =
    dayElement === ELEMENT_WOOD
      ? ELEMENT_FIRE
      : dayElement === ELEMENT_FIRE
        ? ELEMENT_EARTH
        : dayElement === ELEMENT_EARTH
          ? ELEMENT_METAL
          : dayElement === ELEMENT_METAL
            ? ELEMENT_WATER
            : ELEMENT_WOOD;

  const controlledByTarget =
    targetElement === ELEMENT_WOOD
      ? ELEMENT_FIRE
      : targetElement === ELEMENT_FIRE
        ? ELEMENT_EARTH
        : targetElement === ELEMENT_EARTH
          ? ELEMENT_METAL
          : targetElement === ELEMENT_METAL
            ? ELEMENT_WATER
            : ELEMENT_WOOD;

  const controls =
    dayElement === ELEMENT_WOOD
      ? ELEMENT_EARTH
      : dayElement === ELEMENT_FIRE
        ? ELEMENT_METAL
        : dayElement === ELEMENT_EARTH
          ? ELEMENT_WATER
          : dayElement === ELEMENT_METAL
            ? ELEMENT_WOOD
            : ELEMENT_FIRE;

  if (controlledByTarget === dayElement) {
    return "鐖舵瘝";
  }
  if (generates === targetElement) {
    return "瀛愬瓩";
  }
  if (controls === targetElement) {
    return "濡昏储";
  }
  return "瀹橀";
}

function buildDivinationTimeContext(occurredAt?: string): DivinationTimeContext {
  const solar = getSolarFromOccurredAt(occurredAt);
  const lunar = solar.getLunar();

  const monthGanzhi = lunar.getMonthInGanZhi();
  const dayGanzhi = lunar.getDayInGanZhi();
  const hourGanzhi = lunar.getTimeInGanZhi();

  return {
    occurredAt: solar.toYmdHms(),
    solar: solar.toYmdHms(),
    lunar: `${lunar.getYearInChinese()}骞?${lunar.getMonthInChinese()}鏈?${lunar.getDayInChinese()}`,
    jieQi: lunar.getJieQi() || null,
    yearGanzhi: lunar.getYearInGanZhi(),
    monthGanzhi,
    dayGanzhi,
    hourGanzhi,
    monthBuild: monthGanzhi.charAt(1),
    dayBuild: dayGanzhi.charAt(1),
    monthElement: getElementFromGanzhi(monthGanzhi),
    dayElement: getElementFromGanzhi(dayGanzhi)
  };
}

function getElementRelation(source: WuXing, target: WuXing) {
  if (source === target) {
    return "比和";
  }

  const generates: Record<WuXing, WuXing> = {
    木: "火",
    火: "土",
    土: "金",
    金: "水",
    水: "木"
  };

  if (generates[source] === target) {
    return "生";
  }

  if (generates[target] === source) {
    return "受生";
  }

  const controls: Record<WuXing, WuXing> = {
    木: "土",
    火: "金",
    土: "水",
    金: "木",
    水: "火"
  };

  if (controls[source] === target) {
    return "克";
  }

  if (controls[target] === source) {
    return "受克";
  }

  return "平";
}

function topicPrompt(topic: DivinationTopic) {
  switch (topic) {
    case "love":
      return "感情重在节奏、回应和真实需求，不宜只看表面热度。";
    case "career":
      return "事业重在时机、资源承接和推进方式，宜看能否落地。";
    case "wealth":
      return "财运重在承财能力、交易节奏和风险控制。";
    case "health":
      return "健康重在调养和节律，不宜过劳或情绪内耗。";
    case "travel":
      return "出行重在路线、时机与安全边界，宜先稳后动。";
    case "missing-item":
      return "寻物重在方位、场景回溯与最近一次明显动作节点。";
    case "decision":
      return "决断类问题尤其看时机是否成熟，以及代价能否承受。";
    case "relationship":
      return "关系问题重在边界、沟通与现实配合，不只看情绪。";
    default:
      return "此卦适合从局势、节奏、资源和结果四层来理解。";
  }
}

function buildCoinRounds() {
  return Array.from({ length: 6 }, (_, index) => {
    const coins = Array.from({ length: 3 }, () => (Math.random() > 0.5 ? 3 : 2));
    const total = coins.reduce((sum, item) => sum + item, 0);
    const line =
      total === 6 ? "old-yin" : total === 7 ? "young-yang" : total === 8 ? "young-yin" : "old-yang";

    return {
      round: index + 1,
      coins,
      total,
      line
    };
  });
}

function ensureLiuyaoLines(input: LiuyaoInput) {
  if (input.castingMode === "auto") {
    const rounds = buildCoinRounds();
    return {
      rounds,
      lines: rounds.map((item) => item.line) as LiuyaoLineType[]
    };
  }

  if (!input.lines || input.lines.length !== 6) {
    throw new Error("manual liuyao casting requires 6 line results");
  }

  return {
    rounds: input.lines.map((line, index) => ({
      round: index + 1,
      coins: null,
      total: LIUYAO_LINE_MAP[line].code,
      line
    })),
    lines: input.lines
  };
}

function buildHexagramFromBinary(lines: Array<0 | 1>) {
  const lower = getTrigramByLines([lines[0], lines[1], lines[2]]);
  const upper = getTrigramByLines([lines[3], lines[4], lines[5]]);
  const meta = getHexagramMeta(lower, upper);

  return {
    lower,
    upper,
    meta
  };
}

function buildMovingLineInsights(movingLines: number[], topic: DivinationTopic) {
  return movingLines.map((position) => ({
    position,
    title: `第${position}爻动`,
    meaning: LINE_POSITION_MEANINGS[position - 1],
    topicHint:
      topic === "missing-item"
        ? position <= 2
          ? "寻物可先回看起点、桌面、包袋、抽屉等近身位置。"
          : position <= 4
            ? "寻物可回看过渡区域，如车上、门口、工作台、途中停留点。"
            : "寻物可重点看较高处、收尾放置点、被暂时搁置之处。"
        : topic === "love" || topic === "relationship"
          ? position <= 2
            ? "感情重点在开头态度与回应方式。"
            : position <= 4
              ? "感情重点在互动节奏与现实阻力。"
              : "感情重点在定性、承诺与结果判断。"
          : topic === "career" || topic === "wealth"
            ? position <= 2
              ? "事业财运重点在准备度、资源盘点与开局方式。"
              : position <= 4
                ? "事业财运重点在过程摩擦、协作与对外推进。"
                : "事业财运重点在主导权、收益兑现与最终落地。"
            : "该动爻提示这件事的关键转折点就在这个位置。"
  }));
}

function buildLiuyaoSummary(
  primary: ReturnType<typeof buildHexagramFromBinary>,
  transformed: ReturnType<typeof buildHexagramFromBinary>,
  movingLines: number[],
  topic: DivinationTopic
) {
  const relation = getElementRelation(primary.lower.element, primary.upper.element);
  const movement =
    movingLines.length === 0
      ? "静卦"
      : movingLines.length <= 2
        ? "少动"
        : movingLines.length <= 4
          ? "多动"
          : "大动";

  const trend =
    transformed.meta.name === primary.meta.name
      ? "本卦与变卦一致，说明事情核心基调相对稳定。"
      : `本卦为${primary.meta.name}，变卦为${transformed.meta.name}，说明事情会经历一个明显的阶段变化。`;

  return {
    relation,
    movement,
    overall: `${primary.meta.judgment}${trend}`,
    topicAdvice: `${topicPrompt(topic)} 当前卦象关键词偏向${primary.meta.keywords.join("、")}，后续走势会往${transformed.meta.keywords.join("、")}转。`
  };
}

function buildSearchAdvice(directions: string[], movement: string) {
  const likelyZones =
    movement === "静卦"
      ? ["固定放置位", "桌面角落", "柜子抽屉", "袋中夹层"]
      : movement === "少动"
        ? ["最近移动过的包袋", "车内座椅周边", "门口换手处", "临时搁放台面"]
        : ["跨空间移动区域", "高处层架", "办公室与家之间的过渡点", "他人临时接触过的位置"];

  return {
    likelyDirections: directions,
    likelyZones,
    searchOrder: [
      "先回忆最后一次明确使用或看见它的时间点",
      "先搜近身与固定收纳位，再搜过渡区域",
      "若仍未见，再查高处、边角、包夹层或被覆盖处"
    ]
  };
}

function buildLiuyaoAdvancedPattern(
  primary: ReturnType<typeof buildHexagramFromBinary>,
  lineDetails: Array<{ fromBottom: number; changing: boolean; value: 0 | 1 }>,
  occurredAt?: string
) {
  const timeContext = buildDivinationTimeContext(occurredAt);
  const shiYing = SHI_YING_BY_TRIGRAM[primary.lower.key];
  const dayStem = timeContext.dayGanzhi.charAt(0);
  const dayElement = getStemElement(dayStem);
  const spiritStart = getSixSpiritStart(dayStem);

  const lowerBranches = NAJIA_BRANCHES[primary.lower.key];
  const upperBranches = NAJIA_BRANCHES[primary.upper.key];
  const lowerStem = NAJIA_LOWER_STEM[primary.lower.key];
  const upperStem = NAJIA_UPPER_STEM[primary.upper.key];

  const lineChart = lineDetails.map((line, index) => {
    const isUpper = index >= 3;
    const branch = isUpper ? upperBranches[index - 3] : lowerBranches[index];
    const stem = isUpper ? upperStem : lowerStem;
    const lineElement = getBranchElement(branch) ?? getStemElement(stem) ?? ELEMENT_EARTH;
    const spirit = SIX_SPIRITS[(spiritStart + index) % SIX_SPIRITS.length];
    const monthBuildRelation = getElementRelation(lineElement, timeContext.monthElement);
    const dayBuildRelation = getElementRelation(lineElement, timeContext.dayElement);

    return {
      position: line.fromBottom,
      shiRole: line.fromBottom === shiYing.shi ? "涓栫埢" : line.fromBottom === shiYing.ying ? "搴旂埢" : "鏅€氱埢",
      liuQin: getRelationLabel(dayElement, lineElement),
      liuShen: spirit,
      naJia: `${stem}${branch}`,
      branch,
      stem,
      lineElement,
      monthBuildRelation,
      dayBuildRelation,
      moving: line.changing,
      visible: line.value === 1 ? "闃崇埢" : "闃寸埢"
    };
  });

  const missingRelations = ["鐖舵瘝", "鍏勫紵", "瀛愬瓩", "濡昏储", "瀹橀"].filter(
    (relation) => !lineChart.some((item) => item.liuQin === relation)
  );

  const hiddenGods = missingRelations.map((relation, index) => ({
    relation,
    hiddenAt: lineChart[index % lineChart.length].position,
    note: `褰撳墠鍗︿腑鏄庣埢鏈槑鏄炬壙杞?${relation}锛屽彲浣滀负浼忕鍙傝€冦€?`
  }));

  return {
    timeContext,
    shiYing,
    lineChart,
    hiddenGods,
    ruleSummary: {
      monthBuild: timeContext.monthBuild,
      dayBuild: timeContext.dayBuild,
      dominantRelations: lineChart
        .filter((item) => item.shiRole !== "鏅€氱埢" || item.moving)
        .map((item) => `${item.shiRole}${item.liuQin}`)
    }
  };
}

function buildMeihuaExternalOmen(
  externalOmen: MeihuaInput["externalOmen"],
  primary: ReturnType<typeof buildHexagramFromBinary>,
  changed: ReturnType<typeof buildHexagramFromBinary>
) {
  if (!externalOmen) {
    return null;
  }

  const matchedTrigrams: string[] = [];
  const notes: string[] = [];

  if (externalOmen.direction) {
    const hit = TRIGRAMS.find((item) => externalOmen.direction?.includes(item.direction.slice(0, 1)));
    if (hit) {
      matchedTrigrams.push(hit.name);
      notes.push(`鏂瑰悜澶栧簲鍋忓悜${hit.name}${hit.image}涔嬭薄銆?`);
    }
  }

  if (externalOmen.color) {
    if (/绾?涓?/u.test(externalOmen.color)) notes.push("棰滆壊澶栧簲鍋忕伀锛屽己璋冩€佸害銆佹洕鍏夈€佽〃杈俱€?");
    if (/榛?钃?/u.test(externalOmen.color)) notes.push("棰滆壊澶栧簲鍋忔按锛屽己璋冩儏缁€佹祦鍔ㄣ€侀殣鎬у彉鍖栥€?");
    if (/榛?鐧?/u.test(externalOmen.color)) notes.push("棰滆壊澶栧簲鍋忛噾锛屽己璋冭鍒欍€佸彇鑸嶃€佺粨鏋滃垽鏂€?");
  }

  if (externalOmen.motion) {
    notes.push(`鍔ㄦ€�澶栧簲涓?${externalOmen.motion}锛屽緢閫傚悎鐢ㄦ潵鍗拌瘉鏈崷鍒板彉鍗︾殑杞姌鑺傚銆?`);
  }

  if (externalOmen.sound) {
    notes.push(`澹伴煶澶栧簲涓?${externalOmen.sound}锛屽父鐢ㄦ潵杈呭姪鍒ゆ柇鏄惁鏈夊閮ㄤ俊鍙锋寜涓嬭浆鏈恒€?`);
  }

  return {
    matchedTrigrams,
    notes,
    synthesis: `澶栧簲淇℃伅鍙笌鏈崷${primary.meta.name}銆佸彉鍗?${changed.meta.name}鐩镐簰鍗拌瘉锛屾洿閫傚悎鐢ㄦ潵鍒ゆ柇鐭湡楠岃瘉鐐瑰拰鐜板満璇銆?`
  };
}

function buildMeihuaTopicTemplates(
  topic: DivinationTopic,
  relation: string,
  movingLine: number,
  externalOmen: ReturnType<typeof buildMeihuaExternalOmen>
) {
  const base: Record<DivinationTopic, string[]> = {
    love: [
      "鐪嬩富鍔ㄤ竴鏂规槸鍚︽効鎰忕户缁姇鍏ャ€?",
      "鐪嬪弻鏂硅妭濂忔槸鍚﹀悓姝ワ紝鑰屼笉鍙湅鐭湡鐑害銆?",
      "鐪嬪姩鐖诲湪鍓嶄腑鍚庡摢涓€娈碉紝鍒ゆ柇鍙樺寲浼氬厛鍙戠敓鍦ㄦ€佸害銆佷簰鍔ㄨ繕鏄粨鏋溿€?"
    ],
    career: [
      "鐪嬩綋鍗︽槸鍚︽壙寰椾綇鐢ㄥ崷锛屽喅瀹氳兘鍔涘拰鏈轰細鏄惁鍖归厤銆?",
      "鐪嬪彉鍗︽槸鍚﹁蛋鍚戞洿瀹炵殑钀藉湴璞★紝鍒ゆ柇椤圭洰鏄惁鑳芥帹鎴愩€?",
      "鐪嬪姩鐖婚儴浣嶏紝鍒ゆ柇鍗＄偣鏄湪寮€灞€銆佷腑娈垫懇鎿︼紝杩樻槸鏀跺熬鍙樼幇銆?"
    ],
    wealth: [
      "鐪嬭储鏄惁鑳借繘鍙ｈ锛岃€屼笉鍙槸琛ㄩ潰鏈夋満浼氥€?",
      "鐪嬪彉鍗﹀悗鏄杩樻槸鏁ｏ紝鍒ゆ柇鐜伴噾娴佺ǔ涓嶇ǔ銆?",
      "鐪嬪搴旀槸鍚﹀嚭鐜版槑鏄惧偓鍔ㄤ俊鍙凤紝鍒ゆ柇鏄惁閫傚悎鐭嚎鎿嶄綔銆?"
    ],
    health: [
      "鐪嬩綋鍗︽槸鍚﹁兘鎵垮彈鐢ㄥ崷鐨勫帇鍔涳紝鍒ゆ柇鏄惁闇€瑕佸厛鍋滀笅鏉ヨ皟鏁淬€?",
      "鐪嬪彉鍗︽槸鍚﹁蛋鍚戞洿绋冲畾鐨勫崷璞★紝鍒ゆ柇鎭㈠鍜岃皟鍏荤殑鍚庡姴銆?",
      "鐪嬪搴旀槸鍚﹀嚭鐜版樉鑰屾槗瑙佺殑鑰楄兘淇″彿锛屽父鐢ㄦ潵鍒ゆ柇浣滄伅銆佹儏缁垨韬綋鐨勫綋涓嬪弽搴斻€?"
    ],
    travel: [
      "鐪嬫湰鍗﹀拰鍙樺崷鏄悗璺嚎鏄惁绋炽€佽妭濂忔槸鍚﹀規槗琚墦涔便€?",
      "鐪嬪姩鐖绘墍鍦ㄦ浣嶏紝鍒ゆ柇鏄嚭鍙戝墠銆佽矾涓繕鏄埌杈惧悗鏇撮渶瑕佹敞鎰忋€?",
      "鐪嬪搴旂殑鏂瑰悜銆佸０闊冲拰鐜板満鍔ㄧ嚎锛屽父鐢ㄦ潵鍋氬嚭琛屽繉瀹滅殑鐭湡鏍″銆?"
    ],
    relationship: [
      "鐪嬩綋鐢ㄦ槸鐩哥敓杩樻槸鐩稿厠锛屽喅瀹氬叧绯诲綋涓嬫槸浜掔浉鎵樹妇杩樻槸浜掔浉娑堣€椼€?",
      "鐪嬪彉鍗︽槸鍚︽湁鏇村ソ鐨勫悗鍔匡紝鍒ゆ柇鍏崇郴鏄惁鏈夎皟鏁村拰淇绌洪棿銆?",
      "鐪嬪姩鐖绘墍鍦ㄦ浣嶏紝鍙互甯姪鍒ゆ柇鍗＄偣鏄湪寮€澶淬€佷簰鍔ㄨ繕鏄粨鏋滀笂銆?"
    ],
    "missing-item": [
      "鐪嬫湰鍗︽柟浣嶄笌澶栧簲鏂瑰悜鏄惁鐩镐簰鍗拌瘉銆?",
      "鐪嬪姩鐖绘槸鍓嶆銆佷腑娈佃繕鏄悗娈碉紝鍒ゆ柇鐗╁搧鏄湪璧风偣銆侀€斾腑杩樻槸缁堢偣鍖哄煙銆?",
      "鐪嬪搴旈噷鐨勯鑹层€佸姩浣溿€佽Е纰扮墿锛屽父鑳界粰鍑哄叿浣撳湴鐐规彁绀恒€?"
    ],
    decision: [
      "鐪嬩綋鐢ㄦ槸鐩哥敓杩樻槸鐩稿厠锛屽喅瀹氭槸鍚﹂€傚悎鐜板湪灏卞仛瀹氥€?",
      "鐪嬪彉鍗︽槸鍚︽瘮鏈崷鏇寸ǔ锛屽喅瀹氭槸鍚︽湁鍚庡姴銆?",
      `鐪嬪姩鐖诲湪绗?${movingLine}鐖诧紝涓€鑸彁閱掕鍦ㄥ搴旈樁娈垫墍鍦ㄧ殑鍏抽敭鑺傜偣鍋氬垽鏂€?`
    ],
    other: [
      "鐪嬫湰鍗︾煭鏈熶富棰橈紝鍐嶇湅鍙樺崷鍚庣画鍘诲悜銆?",
      "鐪嬩綋鐢ㄧ浉澶勶紝鍒ゆ柇鑷韩鍜屽鍦ㄥ摢涓€杈规洿涓诲銆?",
      "鐪嬪搴旀槸鍚﹁兘涓庡綋鍓嶅崷璞″舰鎴愮幇鍦洪獙璇併€?"
    ]
  };

  const selected = base[topic] ?? base.other;
  return {
    relation,
    templates: selected,
    externalOmenNote: externalOmen?.synthesis ?? null
  };
}

function buildTopicGuidance(input: {
  topic: DivinationTopic;
  mode: "liuyao" | "meihua";
  primary: ReturnType<typeof buildHexagramFromBinary>;
  transformed: ReturnType<typeof buildHexagramFromBinary>;
  movement: string;
  relation: string;
  movingLines: number[];
}) {
  const shared = {
    scene: TOPIC_LABELS[input.topic],
    currentFocus: `${input.primary.meta.name}偏向${input.primary.meta.keywords.join("、")}，说明当前最重要的是先看局势主轴，而不是只盯结果。`
  };

  switch (input.topic) {
    case "missing-item":
      return {
        ...shared,
        favorableAction: "先按方向和最近动线回查，再看高低位与包袋夹层，不要盲翻。",
        caution: "最忌一次性大范围乱找，容易越找越乱，反而漏掉明显位置。",
        timelineHint:
          input.movement === "静卦" ? "更像是没有离开原本环境。" : "更像是经历过一次或多次换手、挪动。",
        ifAskingResult: "寻物类通常先看位置，再看是否短期能回到手上。",
        searchAdvice: buildSearchAdvice(
          [input.primary.upper.direction, input.primary.lower.direction],
          input.movement
        )
      } satisfies TopicGuidance;
    case "love":
    case "relationship":
      return {
        ...shared,
        favorableAction:
          input.relation === "生" || input.relation === "受生"
            ? "适合用温和但明确的方式推进交流，先说真实需求。"
            : "适合先观察互动节奏，别急着逼对方给结论。",
        caution: "最忌情绪上头、试探过多或一边退一边又想要确认。",
        timelineHint:
          input.movingLines.length === 0
            ? "短期格局不容易突然翻转，更看双方持续互动。"
            : "短期会有态度或节奏变化，关键在动爻所指的转折位置。",
        ifAskingResult: "感情类不只看有没有缘分，更看能否承住现实推进。"
      };
    case "career":
    case "wealth":
      return {
        ...shared,
        favorableAction:
          input.primary.meta.keywords.includes("积累") || input.primary.meta.keywords.includes("等待")
            ? "适合先整资源、做准备、补条件，再谈扩张。"
            : "适合边推进边校准，把资源放到最能落地的一点上。",
        caution: "最忌项目没稳就全面铺开，或因为短期卡顿就全盘推翻。",
        timelineHint:
          input.movement === "少动"
            ? "更像是小范围调整后继续推进。"
            : input.movement === "大动"
              ? "变数较大，先稳住核心盘。"
              : "节奏主要取决于你是否抓对重点。",
        ifAskingResult: "事业财运类最重要的不是有没有机会，而是机会接住后能否变现或成事。"
      };
    case "decision":
      return {
        ...shared,
        favorableAction:
          input.primary.meta.keywords.includes("决断") || input.primary.meta.keywords.includes("处理")
            ? "如果基础条件已齐，可以定方向，但要保留修正空间。"
            : "先补信息、补条件，再决定会更稳。",
        caution: "最忌在信息不全、情绪过强或外部压力很大时硬做决定。",
        timelineHint:
          input.transformed.meta.name === input.primary.meta.name
            ? "局势不会马上大变，决策可以偏稳。"
            : "事情还在变，决定前要预留二次调整。",
        ifAskingResult: "决断类不只是选对，还要看选了之后是否承担得起后续代价。"
      };
    default:
      return {
        ...shared,
        favorableAction: "先看主线，再做小步推进。",
        caution: "最忌脱离现实条件空想结果。",
        timelineHint: "先稳住节奏，再观察变化。",
        ifAskingResult: "卦象更适合作为趋势与提醒，而不是替代现实判断。"
      };
  }
}

function buildLiuyaoFrontend(
  input: LiuyaoInput,
  primary: ReturnType<typeof buildHexagramFromBinary>,
  transformed: ReturnType<typeof buildHexagramFromBinary>,
  lines: Array<{
    round: number;
    fromBottom: number;
    fromTop: number;
    type: LiuyaoLineType;
    label: string;
    value: 0 | 1;
    changing: boolean;
    symbol: string;
  }>,
  topicGuidance: TopicGuidance,
  movement: string
) {
  return {
    castingSummary: {
      methodLabel: "金钱课",
      castingModeLabel: input.castingMode === "auto" ? "一键起卦" : "手动选爻",
      movement,
      lineCount: lines.length
    },
    quickCards: [
      { key: "primary", label: "本卦", value: primary.meta.name, note: primary.meta.judgment },
      { key: "changed", label: "变卦", value: transformed.meta.name, note: transformed.meta.judgment },
      { key: "topic", label: "所问事项", value: TOPIC_LABELS[input.topic], note: topicGuidance.timelineHint }
    ],
    lineBoard: lines
      .slice()
      .reverse()
      .map((item, index) => ({
        row: index + 1,
        positionLabel: `第${item.fromTop}层`,
        lineLabel: item.label,
        symbol: item.symbol,
        changing: item.changing,
        marker: item.changing ? "动" : "静"
      })),
    topicPanels: [
      { title: "当前重点", body: topicGuidance.currentFocus },
      { title: "适合怎么做", body: topicGuidance.favorableAction },
      { title: "需要避开什么", body: topicGuidance.caution },
      { title: "结果怎么看", body: topicGuidance.ifAskingResult }
    ],
    searchPanel: topicGuidance.searchAdvice ?? null
  };
}

export function castLiuyao(input: LiuyaoInput) {
  const prepared = ensureLiuyaoLines(input);
  const lineDetails = prepared.lines.map((line, index) => {
    const meta = LIUYAO_LINE_MAP[line];
    return {
      round: index + 1,
      fromBottom: index + 1,
      fromTop: 6 - index,
      type: line,
      label: meta.label,
      value: meta.value,
      changing: meta.changing,
      symbol: meta.value === 1 ? "━━━" : "━ ━"
    };
  });

  const primaryBinary = lineDetails.map((item) => item.value as 0 | 1);
  const transformedBinary = lineDetails.map((item) =>
    (item.changing ? (item.value === 1 ? 0 : 1) : item.value) as 0 | 1
  );
  const primary = buildHexagramFromBinary(primaryBinary);
  const transformed = buildHexagramFromBinary(transformedBinary);
  const movingLines = lineDetails.filter((item) => item.changing).map((item) => item.fromBottom);
  const advancedPattern = buildLiuyaoAdvancedPattern(primary, lineDetails, input.occurredAt);
  const interpretation = buildLiuyaoSummary(primary, transformed, movingLines, input.topic);
  const topicGuidance = buildTopicGuidance({
    topic: input.topic,
    mode: "liuyao",
    primary,
    transformed,
    movement: interpretation.movement,
    relation: interpretation.relation,
    movingLines
  });

  return {
    input,
    method: "liuyao" as const,
    topicLabel: TOPIC_LABELS[input.topic],
    timeContext: input.occurredAt ? buildDivinationTimeContext(input.occurredAt) : advancedPattern.timeContext,
    animation: {
      type: "coin-shell",
      title: "金钱课铜钱龟壳起卦",
      rounds: prepared.rounds
    },
    primaryHexagram: {
      name: primary.meta.name,
      palace: primary.meta.palace,
      keywords: primary.meta.keywords,
      judgment: primary.meta.judgment,
      image: primary.meta.image,
      lowerTrigram: primary.lower,
      upperTrigram: primary.upper
    },
    transformedHexagram: {
      name: transformed.meta.name,
      palace: transformed.meta.palace,
      keywords: transformed.meta.keywords,
      judgment: transformed.meta.judgment,
      image: transformed.meta.image,
      lowerTrigram: transformed.lower,
      upperTrigram: transformed.upper
    },
    lines: lineDetails,
    movingLines,
    advancedPattern,
    movingLineInsights: buildMovingLineInsights(movingLines, input.topic),
    interpretation,
    topicGuidance,
    frontend: buildLiuyaoFrontend(
      input,
      primary,
      transformed,
      lineDetails,
      topicGuidance,
      interpretation.movement
    )
  };
}

function getTimeNumbers(
  occurredAt?: string,
  timeMethod: MeihuaInput["timeMethod"] = "ymdhm",
  externalCount = 0
) {
  const solar = getSolarFromOccurredAt(occurredAt);
  const lunar = solar.getLunar();
  const year = solar.getYear();
  const month = solar.getMonth();
  const day = solar.getDay();
  const hour = solar.getHour();
  const minute = solar.getMinute();

  const base =
    timeMethod === "ymd"
      ? {
          upperSeed: year + month + day,
          lowerSeed: year + month + day + month,
          movingSeed: year + month + day
        }
      : timeMethod === "ymdh"
        ? {
            upperSeed: year + month + day,
            lowerSeed: year + month + day + hour,
            movingSeed: year + month + day + hour
          }
        : timeMethod === "lunar-ymdh"
          ? {
              upperSeed: lunar.getYear() + lunar.getMonth() + lunar.getDay(),
              lowerSeed: lunar.getYear() + lunar.getMonth() + lunar.getDay() + hour,
              movingSeed: lunar.getYear() + lunar.getMonth() + lunar.getDay() + hour
            }
          : {
              upperSeed: year + month + day,
              lowerSeed: year + month + day + hour,
              movingSeed: year + month + day + hour + minute
            };

  return {
    occurredAt: solar.toYmdHms(),
    upperSeed: base.upperSeed + externalCount,
    lowerSeed: base.lowerSeed + externalCount,
    movingSeed: base.movingSeed + externalCount
  };
}

function buildMutualHexagram(lines: Array<0 | 1>) {
  const mutualLower = getTrigramByLines([lines[1], lines[2], lines[3]]);
  const mutualUpper = getTrigramByLines([lines[2], lines[3], lines[4]]);
  return {
    lower: mutualLower,
    upper: mutualUpper,
    meta: getHexagramMeta(mutualLower, mutualUpper)
  };
}

function buildMeihuaInterpretation(
  topic: DivinationTopic,
  body: TrigramMeta,
  use: TrigramMeta,
  primary: ReturnType<typeof buildHexagramFromBinary>,
  changed: ReturnType<typeof buildHexagramFromBinary>
) {
  const relation = getElementRelation(body.element, use.element);

  const relationNote =
    relation === "生" || relation === "受生"
      ? "体用之间有相生助力，事情存在顺势推进空间。"
      : relation === "克" || relation === "受克"
        ? "体用之间有制约，说明中间会有现实阻力或节奏不合。"
        : "体用比和，表示事情核心矛盾不算尖锐，关键在执行与时机。";

  return {
    relation,
    overall: `${primary.meta.judgment}${relationNote}`,
    topicAdvice: `${topicPrompt(topic)} 本卦倾向${primary.meta.keywords.join("、")}，变化后偏向${changed.meta.keywords.join("、")}。`,
    bodyUseAdvice: `体卦为${body.name}${body.image}，用卦为${use.name}${use.image}，宜重点观察“自己能否承住外部变化”这一点。`
  };
}

function buildMeihuaFrontend(
  input: MeihuaInput,
  numberSource: number[],
  timeInfo: string | null,
  movingLine: number,
  primary: ReturnType<typeof buildHexagramFromBinary>,
  mutual: ReturnType<typeof buildMutualHexagram>,
  changed: ReturnType<typeof buildHexagramFromBinary>,
  topicGuidance: TopicGuidance,
  bodyUseRelation: string,
  externalOmenAnalysis: ReturnType<typeof buildMeihuaExternalOmen> | null
) {
  return {
    castingSummary: {
      methodLabel: "梅花易数",
      castingModeLabel: input.castingMode === "time" ? "时间起卦" : "数字起卦",
      numberSource,
      timeInfo,
      movingLine,
      timeMethod: input.timeMethod ?? null
    },
    quickCards: [
      { key: "primary", label: "本卦", value: primary.meta.name, note: primary.meta.judgment },
      { key: "mutual", label: "互卦", value: mutual.meta.name, note: "看事情中段结构与内在过程" },
      { key: "changed", label: "变卦", value: changed.meta.name, note: topicGuidance.timelineHint }
    ],
    bodyUseCard: {
      relation: bodyUseRelation,
      body: `${primary.lower.name}${primary.lower.image}`,
      use: `${primary.upper.name}${primary.upper.image}`,
      explanation: topicGuidance.ifAskingResult
    },
    externalOmen: externalOmenAnalysis,
    topicPanels: [
      { title: "当前重点", body: topicGuidance.currentFocus },
      { title: "适合怎么做", body: topicGuidance.favorableAction },
      { title: "需要避开什么", body: topicGuidance.caution },
      { title: "结果怎么看", body: topicGuidance.ifAskingResult }
    ],
    searchPanel: topicGuidance.searchAdvice ?? null
  };
}

export function castMeihua(input: MeihuaInput) {
  let numberSource: number[];
  let timeInfo: string | null = null;
  const externalCount = input.externalOmen?.countNumber ?? 0;

  if (input.castingMode === "time") {
    const timeNumbers = getTimeNumbers(input.occurredAt, input.timeMethod, externalCount);
    timeInfo = timeNumbers.occurredAt;
    numberSource = [timeNumbers.upperSeed, timeNumbers.lowerSeed, timeNumbers.movingSeed];
  } else {
    if (!input.numbers || (input.numbers.length !== 2 && input.numbers.length !== 3)) {
      throw new Error("meihua number casting requires 2 or 3 numbers");
    }
    numberSource = input.numbers.map((item, index) => item + (index === 2 ? externalCount : 0));
  }

  const upper = getTrigramByNumber(numberSource[0]);
  const lower = getTrigramByNumber(numberSource[1]);
  const movingLine = normalizeMod(numberSource[2] ?? numberSource[0] + numberSource[1], 6);
  const primaryBinary = [...lower.lines, ...upper.lines] as Array<0 | 1>;
  const changedBinary = primaryBinary.map((line, index) =>
    (index + 1 === movingLine ? (line === 1 ? 0 : 1) : line) as 0 | 1
  );
  const primary = buildHexagramFromBinary(primaryBinary);
  const changed = buildHexagramFromBinary(changedBinary);
  const mutual = buildMutualHexagram(primaryBinary);
  const body = lower;
  const use = upper;
  const timeContext = buildDivinationTimeContext(timeInfo ?? input.occurredAt);
  const externalOmenAnalysis = buildMeihuaExternalOmen(input.externalOmen, primary, changed);
  const interpretation = buildMeihuaInterpretation(input.topic, body, use, primary, changed);
  const topicTemplates = buildMeihuaTopicTemplates(
    input.topic,
    interpretation.relation,
    movingLine,
    externalOmenAnalysis
  );
  const topicGuidance = buildTopicGuidance({
    topic: input.topic,
    mode: "meihua",
    primary,
    transformed: changed,
    movement: movingLine <= 2 ? "前段动" : movingLine <= 4 ? "中段动" : "后段动",
    relation: interpretation.relation,
    movingLines: [movingLine]
  });

  return {
    input,
    method: "meihua" as const,
    topicLabel: TOPIC_LABELS[input.topic],
    timeContext,
    timeInfo,
    timeMethod: input.timeMethod ?? (input.castingMode === "time" ? "ymdhm" : null),
    numberSource,
    externalOmenAnalysis,
    topicTemplates,
    primaryHexagram: {
      name: primary.meta.name,
      palace: primary.meta.palace,
      keywords: primary.meta.keywords,
      judgment: primary.meta.judgment,
      image: primary.meta.image,
      lowerTrigram: primary.lower,
      upperTrigram: primary.upper
    },
    mutualHexagram: {
      name: mutual.meta.name,
      palace: mutual.meta.palace,
      keywords: mutual.meta.keywords,
      judgment: mutual.meta.judgment,
      image: mutual.meta.image,
      lowerTrigram: mutual.lower,
      upperTrigram: mutual.upper
    },
    changedHexagram: {
      name: changed.meta.name,
      palace: changed.meta.palace,
      keywords: changed.meta.keywords,
      judgment: changed.meta.judgment,
      image: changed.meta.image,
      lowerTrigram: changed.lower,
      upperTrigram: changed.upper
    },
    bodyUse: {
      body,
      use,
      relation: getElementRelation(body.element, use.element)
    },
    movingLine,
    interpretation,
    topicGuidance,
    frontend: buildMeihuaFrontend(
      input,
      numberSource,
      timeInfo,
      movingLine,
      primary,
      mutual,
      changed,
      topicGuidance,
      interpretation.relation,
      externalOmenAnalysis
    )
  };
}

export function buildLiuyaoAiContext(result: ReturnType<typeof castLiuyao>) {
  return {
    module: "liuyao",
    contextVersion: "v2",
    summaryCard: {
      topic: result.topicLabel,
      title: result.input.title,
      primaryHexagram: result.primaryHexagram.name,
      transformedHexagram: result.transformedHexagram.name,
      movingLines: result.movingLines,
      movement: result.interpretation.movement
    },
    consultationBrief: {
      currentFocus: result.topicGuidance.currentFocus,
      favorableAction: result.topicGuidance.favorableAction,
      caution: result.topicGuidance.caution,
      timelineHint: result.topicGuidance.timelineHint
    },
    hexagramContext: {
      timeContext: result.timeContext,
      primaryHexagram: {
        name: result.primaryHexagram.name,
        keywords: result.primaryHexagram.keywords,
        judgment: result.primaryHexagram.judgment
      },
      transformedHexagram: {
        name: result.transformedHexagram.name,
        keywords: result.transformedHexagram.keywords,
        judgment: result.transformedHexagram.judgment
      },
      movingLines: result.movingLineInsights.map((item) => ({
        position: item.position,
        title: item.title,
        topicHint: item.topicHint
      })),
      advancedPattern: result.advancedPattern
    },
    suggestedQuestions: [
      "这件事现在更适合主动推进还是先观望？",
      "这个卦真正的卡点在过程还是结果？",
      "如果我是问感情或事业，短期转机大概落在哪一步？"
    ],
    systemPrompt:
      "你是青筮记AI六爻命理师。只能基于当前本卦、变卦、动爻和专项断语回答。先说结论，再说依据，最后给行动建议。尽量简洁具体。"
  };
}

export function buildMeihuaAiContext(result: ReturnType<typeof castMeihua>) {
  return {
    module: "meihua",
    contextVersion: "v2",
    summaryCard: {
      topic: result.topicLabel,
      title: result.input.title,
      primaryHexagram: result.primaryHexagram.name,
      mutualHexagram: result.mutualHexagram.name,
      changedHexagram: result.changedHexagram.name,
      movingLine: result.movingLine,
      bodyUseRelation: result.bodyUse.relation
    },
    consultationBrief: {
      currentFocus: result.topicGuidance.currentFocus,
      favorableAction: result.topicGuidance.favorableAction,
      caution: result.topicGuidance.caution,
      timelineHint: result.topicGuidance.timelineHint
    },
    hexagramContext: {
      timeContext: result.timeContext,
      primaryHexagram: {
        name: result.primaryHexagram.name,
        keywords: result.primaryHexagram.keywords,
        judgment: result.primaryHexagram.judgment
      },
      mutualHexagram: {
        name: result.mutualHexagram.name,
        keywords: result.mutualHexagram.keywords
      },
      changedHexagram: {
        name: result.changedHexagram.name,
        keywords: result.changedHexagram.keywords,
        judgment: result.changedHexagram.judgment
      },
      bodyUse: {
        relation: result.bodyUse.relation,
        body: result.bodyUse.body.name,
        use: result.bodyUse.use.name
      },
      externalOmen: result.externalOmenAnalysis,
      topicTemplates: result.topicTemplates
    },
    suggestedQuestions: [
      "这件事的核心矛盾在我还是在外部环境？",
      "我现在更适合继续深挖，还是换方向？",
      "请把本卦到变卦的变化用白话告诉我。"
    ],
    systemPrompt:
      "你是青筮记AI梅花易数命理师。只能基于当前本卦、互卦、变卦、体用和专项断语回答。先说结论，再说体用和卦变逻辑，最后给行动建议。尽量简洁具体。"
  };
}
