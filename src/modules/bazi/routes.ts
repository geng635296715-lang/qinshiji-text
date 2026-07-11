import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getRequestUser } from "../../shared/auth/request.js";
import { consultWithDeepSeek } from "../ai/service.js";
import { upsertBaziProfileForUser } from "../user-center/service.js";
import {
  buildBaziAiContext,
  buildBaziAiView,
  buildBaziPageView,
  buildCompatibilityAiContext,
  buildCompatibilityPageView
} from "./presenter.js";
import { analyzeBazi, analyzeBaziCompatibility, buildLunarPickerOptions } from "./service.js";

const baziInputSchema = z.object({
  calendarType: z.enum(["solar", "lunar"]),
  birthDate: z.string(),
  birthTime: z.string(),
  gender: z.enum(["male", "female", "other"]),
  birthPlace: z.string().min(1),
  focusYear: z.number().int().optional(),
  isVip: z.boolean().optional().default(false)
});

const compatibilityPersonSchema = z.object({
  calendarType: z.enum(["solar", "lunar"]),
  birthDate: z.string(),
  birthTime: z.string(),
  gender: z.enum(["male", "female", "other"]),
  birthPlace: z.string().min(1)
});

const compatibilityInputSchema = z.object({
  relationType: z.enum([
    "family",
    "parent-child",
    "couple",
    "same-sex-couple",
    "colleague",
    "boss-employee",
    "partner"
  ]),
  focusYear: z.number().int().optional(),
  isVip: z.boolean().optional().default(false),
  personA: compatibilityPersonSchema,
  personB: compatibilityPersonSchema
});

const lunarPickerQuerySchema = z.object({
  year: z.coerce.number().int(),
  month: z.coerce.number().int().optional(),
  day: z.coerce.number().int().optional()
});

const flowInsightAiSchema = z.object({
  section: z.enum(["dayun", "liunian", "liuyue"]),
  headline: z.string().min(1),
  item: z.record(z.string(), z.unknown()),
  aiContext: z.record(z.string(), z.unknown())
});

const flowInsightBatchAiSchema = z.object({
  section: z.enum(["dayun", "liunian", "liuyue"]),
  items: z.array(
    z.object({
      key: z.string().min(1),
      headline: z.string().min(1),
      item: z.record(z.string(), z.unknown())
    })
  ).min(1),
  aiContext: z.record(z.string(), z.unknown()),
  accessMode: z.enum(["normal", "vip", "free"]).optional().default("normal")
});

const flowReferenceAiSchema = z.object({
  section: z.enum(["dayun", "liunian", "liuyue"]),
  items: z.array(
    z.object({
      key: z.string().min(1),
      headline: z.string().min(1),
      item: z.record(z.string(), z.unknown())
    })
  ).min(1),
  aiContext: z.record(z.string(), z.unknown())
});

function extractJsonCandidate(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const normalized = (fenced?.[1] ?? value)
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
  const objectStart = normalized.indexOf("{");
  const arrayStart = normalized.indexOf("[");
  const startCandidates = [objectStart, arrayStart].filter((index) => index >= 0);
  const start = startCandidates.length ? Math.min(...startCandidates) : -1;
  const objectEnd = normalized.lastIndexOf("}");
  const arrayEnd = normalized.lastIndexOf("]");
  const end = Math.max(objectEnd, arrayEnd);
  const candidate = start >= 0 && end > start ? normalized.slice(start, end + 1) : normalized;
  return candidate.replace(/,\s*([}\]])/g, "$1").trim();
}

function parseJsonObject<T>(value: string) {
  const jsonText = extractJsonCandidate(value);
  return JSON.parse(jsonText) as T;
}

function getFlowSectionLabel(section: "dayun" | "liunian" | "liuyue") {
  if (section === "dayun") return "??";
  if (section === "liunian") return "?? / ??";
  return "??";
}

function buildFlowItemDigest(section: "dayun" | "liunian" | "liuyue", item?: Record<string, unknown>) {
  if (!item) return "";
  const flowInsight = (item.flowInsight as Record<string, unknown> | undefined) ?? {};
  const shenShaAnalysis = (item.shenShaAnalysis as Record<string, unknown> | undefined) ?? {};
  const commonItems = Array.isArray(shenShaAnalysis.commonItems)
    ? shenShaAnalysis.commonItems.slice(0, 4)
    : [];
  const shenShaNames = commonItems
    .map((entry) => (entry && typeof entry === "object" ? String((entry as Record<string, unknown>).name || "").trim() : ""))
    .filter(Boolean);
  const parts = [
    `阶段类型：${section}`,
    item.ganzhi ? `干支：${String(item.ganzhi)}` : "",
    "year" in item && item.year ? `年份：${String(item.year)}` : "",
    "age" in item && item.age ? `年龄：${String(item.age)}` : "",
    "startYear" in item && item.startYear ? `起始年份：${String(item.startYear)}` : "",
    "endYear" in item && item.endYear ? `结束年份：${String(item.endYear)}` : "",
    "solarTerm" in item && item.solarTerm ? `节气：${String(item.solarTerm)}` : "",
    "solarDateLabel" in item && item.solarDateLabel ? `节气日期：${String(item.solarDateLabel)}` : "",
    "monthChinese" in item && item.monthChinese ? `月序：${String(item.monthChinese)}月` : "",
    flowInsight.relationToDayMaster ? `与日主关系：${String(flowInsight.relationToDayMaster)}` : "",
    flowInsight.favorability ? `吉凶倾向：${String(flowInsight.favorability)}` : "",
    typeof flowInsight.score === "number" ? `阶段评分：${flowInsight.score}` : "",
    flowInsight.note ? `阶段提示：${String(flowInsight.note)}` : "",
    shenShaNames.length ? `重点神煞：${shenShaNames.join("、")}` : ""
  ].filter(Boolean);

  return parts.join("；");
}

function buildFlowInsightQuestion(
  section: "dayun" | "liunian" | "liuyue",
  sectionLabel: string,
  headline: string,
  item?: Record<string, unknown>
) {
  return [
    `请结合当前八字命帖与当前${sectionLabel}阶段，输出六维短句分析。`,
    "不要 markdown，不要解释原因，不要前言后语。",
    "严格只输出下面 6 行：",
    "overall: ...",
    "wealth: ...",
    "emotion: ...",
    "career: ...",
    "health: ...",
    "summary: ...",
    "要求：",
    "1. 每行只写一句简体中文，10到22个字，直接给结果，不要给过程。",
    "2. 六行之间不要重复话术，不要出现几乎相同的套话。",
    "3. 必须根据当前阶段独有的干支、节气、神煞、吉凶倾向写出差异。",
    "4. overall 这一行必须明确带出当前阶段的干支、年份或节气信息，不能写成通用句。",
    `当前阶段：${headline}`,
    item ? `阶段摘要：${buildFlowItemDigest(section, item)}` : ""
  ].join("\n");
}

function buildFlowInsightBatchQuestion(
  sectionLabel: string,
  items: Array<{ key: string; headline: string; item: Record<string, unknown> }>
) {
  return [
    `请结合当前八字命帖，为以下${sectionLabel}阶段分别生成六维短句分析。`,
    "不要 markdown，不要解释原因，不要前言后语。",
    "严格按下面格式输出，每个 key 一个区块：",
    "[key]",
    "overall: ...",
    "wealth: ...",
    "emotion: ...",
    "career: ...",
    "health: ...",
    "summary: ...",
    "要求：",
    "1. 每个区块必须保留原始 key，不要遗漏，不要重复。",
    "2. 每行只写一句简体中文，8到18个字，直接给结果。",
    "3. 不同阶段必须体现差异，不能套用重复话术。",
    `阶段列表：${JSON.stringify(items)}`
  ].join("\n");
}

function buildJsonRepairQuestion(rawText: string, jsonShape: string) {
  return [
    "请把下面内容整理成严格 JSON。",
    "不要解释，不要补充说明，不要 markdown。",
    `只允许输出这一种结构：${jsonShape}`,
    "原始内容如下：",
    rawText
  ].join("\n");
}

const FLOW_METRIC_KEYS = ["overall", "wealth", "emotion", "career", "health", "summary"] as const;

function normalizeAiTextBlock(value: string) {
  const fenced = value.match(/```(?:text|plain|json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? value).replace(/\r/g, "").trim();
}

function parseFlowMetricLines(value: string) {
  const text = normalizeAiTextBlock(value);
  const metrics: Record<string, string> = {};

  for (const key of FLOW_METRIC_KEYS) {
    const match = text.match(new RegExp(`(?:^|\\n)${key}\\s*[:：]\\s*([^\\n]+)`, "i"));
    metrics[key] = (match?.[1] ?? "").trim();
  }

  return metrics;
}

function parseFlowMetricBlocks(value: string) {
  const text = normalizeAiTextBlock(value);
  const blocks = text
    .split(/\n(?=\[[^\]]+\])/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const keyMatch = block.match(/^\[([^\]]+)\]/);
      const key = keyMatch?.[1]?.trim() ?? "";
      return {
        key,
        metrics: parseFlowMetricLines(block)
      };
    })
    .filter((entry) => entry.key);
}

function buildFlowMetricRepairQuestion(rawText: string) {
  return [
    "请把下面内容整理成六维短句固定格式。",
    "不要解释，不要补充，只输出这 6 行：",
    "overall: ...",
    "wealth: ...",
    "emotion: ...",
    "career: ...",
    "health: ...",
    "summary: ...",
    "原始内容如下：",
    rawText
  ].join("\n");
}

function buildFlowMetricBatchRepairQuestion(rawText: string, keys: string[]) {
  return [
    "请把下面内容整理成多区块六维短句固定格式。",
    "不要解释，不要补充。",
    "每个区块格式如下：",
    "[key]",
    "overall: ...",
    "wealth: ...",
    "emotion: ...",
    "career: ...",
    "health: ...",
    "summary: ...",
    `必须覆盖这些 key：${keys.join(", ")}`,
    "原始内容如下：",
    rawText
  ].join("\n");
}

async function parseAiJsonWithRepair<T>(options: {
  sessionId: string;
  module: "bazi";
  context: { module: "bazi"; aiContext: Record<string, unknown> };
  question: string;
  jsonShape: string;
  temperature?: number;
  maxTokens?: number;
  repairMaxTokens?: number;
}) {
  const firstResult = await consultWithDeepSeek({
    module: options.module,
    sessionId: options.sessionId,
    context: options.context,
    question: options.question,
    temperature: options.temperature ?? 0.35,
    maxTokens: options.maxTokens ?? 320
  });

  try {
    return {
      parsed: parseJsonObject<T>(firstResult.answer),
      model: firstResult.model,
      usage: firstResult.usage
    };
  } catch {
    const repairedResult = await consultWithDeepSeek({
      module: options.module,
      sessionId: `${options.sessionId}-repair`,
      context: options.context,
      question: buildJsonRepairQuestion(firstResult.answer, options.jsonShape),
      temperature: 0.1,
      maxTokens: options.repairMaxTokens ?? options.maxTokens ?? 320
    });

    return {
      parsed: parseJsonObject<T>(repairedResult.answer),
      model: repairedResult.model,
      usage: {
        promptTokens: (firstResult.usage?.promptTokens ?? 0) + (repairedResult.usage?.promptTokens ?? 0),
        completionTokens: (firstResult.usage?.completionTokens ?? 0) + (repairedResult.usage?.completionTokens ?? 0),
        totalTokens: (firstResult.usage?.totalTokens ?? 0) + (repairedResult.usage?.totalTokens ?? 0)
      }
    };
  }
}

async function generateFlowMetrics(options: {
  sessionId: string;
  context: { module: "bazi"; aiContext: Record<string, unknown> };
  question: string;
  repairMaxTokens?: number;
}) {
  const firstResult = await consultWithDeepSeek({
    module: "bazi",
    sessionId: options.sessionId,
    context: options.context,
    question: options.question,
    temperature: 0.45,
    maxTokens: 420
  });

  let metrics = parseFlowMetricLines(firstResult.answer);
  const missing = FLOW_METRIC_KEYS.filter((key) => !metrics[key]?.trim());

  if (!missing.length) {
    return { metrics, model: firstResult.model, usage: firstResult.usage };
  }

  const repairedResult = await consultWithDeepSeek({
    module: "bazi",
    sessionId: `${options.sessionId}-repair`,
    context: options.context,
    question: buildFlowMetricRepairQuestion(firstResult.answer),
    temperature: 0.1,
    maxTokens: options.repairMaxTokens ?? 420
  });

  metrics = parseFlowMetricLines(repairedResult.answer);
  return {
    metrics,
    model: repairedResult.model,
    usage: {
      promptTokens: (firstResult.usage?.promptTokens ?? 0) + (repairedResult.usage?.promptTokens ?? 0),
      completionTokens: (firstResult.usage?.completionTokens ?? 0) + (repairedResult.usage?.completionTokens ?? 0),
      totalTokens: (firstResult.usage?.totalTokens ?? 0) + (repairedResult.usage?.totalTokens ?? 0)
    }
  };
}

async function generateFlowMetricBatch(options: {
  sessionId: string;
  context: { module: "bazi"; aiContext: Record<string, unknown> };
  section: "dayun" | "liunian" | "liuyue";
  sectionLabel: string;
  items: Array<{ key: string; headline: string; item: Record<string, unknown> }>;
  repairMaxTokens?: number;
}) {
  const usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };
  const results: Array<{ key: string; metrics: Record<string, string> }> = [];
  let model = "deepseek-chat";
  const concurrency = 3;

  for (let index = 0; index < options.items.length; index += concurrency) {
    const slice = options.items.slice(index, index + concurrency);
    const settled = await Promise.all(
      slice.map(async (entry) => {
        const aiResult = await generateFlowMetrics({
          sessionId: `${options.sessionId}-${entry.key}`,
          context: {
            module: "bazi",
            aiContext: {
              ...(options.context.aiContext ?? {}),
              flowMetricTarget: {
                key: entry.key,
                headline: entry.headline,
                sectionLabel: options.sectionLabel,
                item: entry.item
              }
            }
          },
          question: buildFlowInsightQuestion(options.section, options.sectionLabel, entry.headline, entry.item),
          repairMaxTokens: options.repairMaxTokens ?? 420
        });

        return {
          key: entry.key,
          metrics: aiResult.metrics,
          model: aiResult.model,
          usage: aiResult.usage
        };
      })
    );

    for (const entry of settled) {
      model = entry.model || model;
      usage.promptTokens += entry.usage?.promptTokens ?? 0;
      usage.completionTokens += entry.usage?.completionTokens ?? 0;
      usage.totalTokens += entry.usage?.totalTokens ?? 0;
      results.push({
        key: entry.key,
        metrics: entry.metrics
      });
    }
  }

  return {
    items: results,
    model,
    usage
  };
}

function normalizeMetricSentence(value: unknown, fallback: string, maxLength = 34) {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return fallback;
  const firstSentence = raw.split(/[。！？!\n]/).map((item) => item.trim()).find(Boolean) ?? raw;
  return firstSentence.length > maxLength ? `${firstSentence.slice(0, maxLength - 1)}…` : firstSentence;
}

function buildFlowMetricFallback(section: "dayun" | "liunian" | "liuyue", item: Record<string, unknown>) {
  const flowInsight = (item?.flowInsight as Record<string, unknown> | undefined) ?? {};
  const relation = String(flowInsight.relationToDayMaster || "干支互动").trim();
  const note = String(flowInsight.note || "宜稳中求进").trim();
  const favorability = String(flowInsight.favorability || "neutral");
  const sectionLabel = section === "dayun" ? "此运" : section === "liunian" ? "此年" : "此月";
  const trendText =
    favorability === "favorable" ? `${sectionLabel}整体偏顺，可主动推进。` : favorability === "challenging" ? `${sectionLabel}波动偏多，宜稳守节奏。` : `${sectionLabel}起伏中等，先稳后动更利。`;

  return {
    overall: trendText,
    wealth: `${relation}临财，求财宜稳不宜急。`,
    emotion: `${sectionLabel}情感看重沟通，少带情绪。`,
    career: `${sectionLabel}事业重执行与落地，先稳后进。`,
    health: `${sectionLabel}注意作息与压力，避免过劳。`,
    summary: normalizeMetricSentence(note, `${sectionLabel}顺势布局更容易见效。`)
  };
}

export async function registerBaziRoutes(app: FastifyInstance) {
  app.get("/api/v1/bazi/lunar-picker", async (request, reply) => {
    const parsed = lunarPickerQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid lunar picker query",
        issues: parsed.error.issues
      });
    }

    try {
      return {
        result: buildLunarPickerOptions(parsed.data.year, parsed.data.month, parsed.data.day)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build lunar picker options"
      });
    }
  });

  app.post("/api/v1/bazi/analyze", async (request, reply) => {
    const parsed = baziInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = analyzeBazi(parsed.data);
      const user = getRequestUser(request);
      if (user) {
        upsertBaziProfileForUser({
          userId: user.id,
          profile: parsed.data,
          analysisSnapshot: result
        });
      }
      return { result };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to analyze bazi"
      });
    }
  });

  app.post("/api/v1/bazi/compatibility", async (request, reply) => {
    const parsed = compatibilityInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi compatibility input",
        issues: parsed.error.issues
      });
    }

    try {
      return {
        result: analyzeBaziCompatibility(parsed.data)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to analyze bazi compatibility"
      });
    }
  });

  app.post("/api/v1/bazi/analyze-view", async (request, reply) => {
    const parsed = baziInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = analyzeBazi(parsed.data);
      const user = getRequestUser(request);
      if (user) {
        upsertBaziProfileForUser({
          userId: user.id,
          profile: parsed.data,
          analysisSnapshot: result
        });
      }
      return {
        result,
        view: buildBaziPageView(result)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build bazi page view"
      });
    }
  });

  app.post("/api/v1/bazi/compatibility-view", async (request, reply) => {
    const parsed = compatibilityInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi compatibility input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = analyzeBaziCompatibility(parsed.data);
      return {
        result,
        view: buildCompatibilityPageView(result)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build compatibility page view"
      });
    }
  });

  app.post("/api/v1/bazi/ai-context", async (request, reply) => {
    const parsed = baziInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = analyzeBazi(parsed.data);
      const aiContext = buildBaziAiContext(result);

      return {
        result,
        aiContext,
        aiView: buildBaziAiView(aiContext)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build bazi AI context"
      });
    }
  });

  app.post("/api/v1/bazi/compatibility-ai-context", async (request, reply) => {
    const parsed = compatibilityInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi compatibility input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = analyzeBaziCompatibility(parsed.data);
      const aiContext = buildCompatibilityAiContext(result);

      return {
        result,
        aiContext,
        aiView: buildBaziAiView(aiContext)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build compatibility AI context"
      });
    }
  });

  app.post("/api/v1/bazi/flow-insight-v2-ai", async (request, reply) => {
    const parsed = flowInsightAiSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid flow insight AI payload",
        issues: parsed.error.issues
      });
    }

    try {
      const sectionLabel = getFlowSectionLabel(parsed.data.section);
      const aiResult = await generateFlowMetrics({
        sessionId: `bazi-flow-v2-${parsed.data.section}`,
        context: {
          module: "bazi",
          aiContext: {
            ...(parsed.data.aiContext ?? {}),
            flowMetricTarget: {
              section: parsed.data.section,
              sectionLabel,
              headline: parsed.data.headline,
              item: parsed.data.item
            }
          }
        },
        question: buildFlowInsightQuestion(parsed.data.section, sectionLabel, parsed.data.headline, parsed.data.item),
        repairMaxTokens: 420
      });

      const fallbackMetrics = buildFlowMetricFallback(parsed.data.section, parsed.data.item);
      const metrics = aiResult.metrics;
      return {
        result: {
          section: parsed.data.section,
          metrics: {
            overall: normalizeMetricSentence(metrics.overall, fallbackMetrics.overall),
            wealth: normalizeMetricSentence(metrics.wealth, fallbackMetrics.wealth),
            emotion: normalizeMetricSentence(metrics.emotion, fallbackMetrics.emotion),
            career: normalizeMetricSentence(metrics.career, fallbackMetrics.career),
            health: normalizeMetricSentence(metrics.health, fallbackMetrics.health),
            summary: normalizeMetricSentence(metrics.summary, fallbackMetrics.summary)
          },
          provider: "deepseek",
          model: aiResult.model,
          usage: aiResult.usage
        }
      };
    } catch (error) {
      return reply.status(500).send({
        message: error instanceof Error ? error.message : "Failed to build flow insight AI content"
      });
    }
  });

  app.post("/api/v1/bazi/flow-insight-batch-v2-ai", async (request, reply) => {
    const parsed = flowInsightBatchAiSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid flow insight batch AI payload",
        issues: parsed.error.issues
      });
    }

    if (parsed.data.accessMode === "normal" && parsed.data.items.length > 1) {
      return reply.status(403).send({
        message: "当前为普通端口，仅支持生成当下阶段分析，开通 VIP 或切换限时免费后可解锁全部阶段。"
      });
    }

    try {
      const sectionLabel = getFlowSectionLabel(parsed.data.section);
      const aiResult = await generateFlowMetricBatch({
        sessionId: `bazi-flow-batch-v2-${parsed.data.section}`,
        context: {
          module: "bazi",
          aiContext: {
            ...(parsed.data.aiContext ?? {}),
            flowMetricTarget: {
              section: parsed.data.section,
              sectionLabel,
              items: parsed.data.items
            }
          }
        },
        section: parsed.data.section,
        sectionLabel,
        items: parsed.data.items,
        repairMaxTokens: 2200
      });

      const parsedJson = { items: aiResult.items };
      const metricsMap = new Map(
        (parsedJson.items || []).map((item) => [String(item.key || "").trim(), item])
      );

      return {
        result: {
          section: parsed.data.section,
          items: parsed.data.items.map((sourceItem) => {
            const matched = metricsMap.get(sourceItem.key);
            const matchedMetrics = matched?.metrics ?? {};
            const fallbackMetrics = buildFlowMetricFallback(parsed.data.section, sourceItem.item);
            return {
              key: sourceItem.key,
              metrics: {
                overall: normalizeMetricSentence(matchedMetrics.overall, fallbackMetrics.overall),
                wealth: normalizeMetricSentence(matchedMetrics.wealth, fallbackMetrics.wealth),
                emotion: normalizeMetricSentence(matchedMetrics.emotion, fallbackMetrics.emotion),
                career: normalizeMetricSentence(matchedMetrics.career, fallbackMetrics.career),
                health: normalizeMetricSentence(matchedMetrics.health, fallbackMetrics.health),
                summary: normalizeMetricSentence(matchedMetrics.summary, fallbackMetrics.summary)
              }
            };
          }),
          provider: "deepseek",
          model: aiResult.model,
          usage: aiResult.usage
        }
      };
    } catch (error) {
      return reply.status(500).send({
        message: error instanceof Error ? error.message : "Failed to build flow insight batch AI content"
      });
    }
  });

  app.post("/api/v1/bazi/flow-reference-ai", async (request, reply) => {
    const parsed = flowReferenceAiSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid flow reference AI payload",
        issues: parsed.error.issues
      });
    }

    const sectionLabel = getFlowSectionLabel(parsed.data.section);

    try {
      const aiResult = await parseAiJsonWithRepair<{ items: Array<{ key: string; note: string }> }>({
        module: "bazi",
        sessionId: `bazi-flow-reference-${parsed.data.section}`,
        context: {
          module: "bazi",
          aiContext: {
            ...(parsed.data.aiContext ?? {}),
            flowReferenceTarget: {
              section: parsed.data.section,
              sectionLabel,
              items: parsed.data.items
            }
          }
        },
        question: [
          `请根据当前八字命帖，为以下${sectionLabel}卡片逐条生成极短分析，严格只返回 JSON。`,
          "不要 markdown，不要解释，不要补充原因。",
          '{"items":[{"key":"","note":""}]} 这是唯一允许的 JSON 结构。',
          "要求：",
          "1. 每条 note 只写 1 句简体中文。",
          "2. 每条控制在 10 到 22 个字。",
          "3. 直接、专业、像命理断语。",
          "4. 不要遗漏或重复任何 key。",
          `5. 当前卡片数据：${JSON.stringify(parsed.data.items)}`
        ].join("\n"),
        temperature: 0.35,
        maxTokens: 900,
        repairMaxTokens: 900,
        jsonShape: '{"items":[{"key":"","note":""}]}'
      });

      const parsedJson = aiResult.parsed;
      return {
        result: {
          section: parsed.data.section,
          items: (parsedJson.items || []).map((item) => ({
            key: String(item.key || "").trim(),
            note: String(item.note || "").trim()
          }))
        }
      };
    } catch (error) {
      return reply.status(500).send({
        message: error instanceof Error ? error.message : "Failed to build flow reference AI content"
      });
    }
  });
}
