import { env } from "../../config/env.js";

type ConsultModule = "bazi" | "liuyao" | "meihua" | "qingzhi-advice";
type ChatRole = "user" | "assistant";

export type AiConsultInput = {
  module: ConsultModule;
  sessionId: string;
  question: string;
  context?: Record<string, unknown>;
  history?: Array<{
    role: ChatRole;
    content: string;
  }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

function getDefaultSystemPrompt(module: ConsultModule) {
  if (module === "bazi") {
    return "你是青筮记AI八字命理师。只能基于当前八字结果回答。先给结论，再给原因和建议，简洁具体。";
  }

  if (module === "qingzhi-advice") {
    return "你是青筮记AI咨询助手。只能基于当前青筮建议结果回答。优先说时间点、适合做什么、为什么、避开什么，简洁具体。";
  }

  if (module === "liuyao") {
    return "你是青筮记AI六爻命理师。只能基于当前本卦、变卦、动爻和专项断语回答。先结论，再依据，再建议。";
  }

  return "你是青筮记AI梅花易数命理师。只能基于当前本卦、互卦、变卦、体用和专项断语回答。先结论，再依据，再建议。";
}

function getSystemPrompt(module: ConsultModule, context: Record<string, unknown>) {
  const prompt = context.aiContext;

  if (
    prompt &&
    typeof prompt === "object" &&
    "systemPrompt" in prompt &&
    typeof prompt.systemPrompt === "string" &&
    prompt.systemPrompt.trim().length > 0
  ) {
    return prompt.systemPrompt;
  }

  return getDefaultSystemPrompt(module);
}

function compactDivinationContext(ai: Record<string, unknown>) {
  return {
    aiContext: {
      module: ai.module,
      summaryCard: ai.summaryCard,
      consultationBrief: ai.consultationBrief,
      hexagramContext: ai.hexagramContext,
      suggestedQuestions: ai.suggestedQuestions
    }
  };
}

function compactContextPayload(context: Record<string, unknown>) {
  const aiContext = context.aiContext;

  if (!aiContext || typeof aiContext !== "object") {
    return context;
  }

  const ai = aiContext as Record<string, unknown>;
  const flowContext =
    ai.flowContext && typeof ai.flowContext === "object" ? (ai.flowContext as Record<string, unknown>) : null;
  const premiumContext =
    ai.premiumContext && typeof ai.premiumContext === "object"
      ? (ai.premiumContext as Record<string, unknown>)
      : null;

  if (context.module === "qingzhi-advice" || ai.module === "qingzhi-advice") {
    return {
      aiContext: {
        module: ai.module,
        summaryCard: ai.summaryCard,
        timingContext: ai.timingContext,
        sevenDayFocus: Array.isArray(ai.sevenDayFocus) ? ai.sevenDayFocus.slice(0, 5) : [],
        auspiciousCategorySummary: Array.isArray(ai.auspiciousCategorySummary)
          ? ai.auspiciousCategorySummary.slice(0, 4)
          : [],
        directionSceneAdvice: ai.directionSceneAdvice,
        styleAdvice: ai.styleAdvice
      }
    };
  }

  if (context.module === "bazi" || (typeof ai.module === "string" && String(ai.module).startsWith("bazi"))) {
    return {
      aiContext: {
        module: ai.module,
        summaryCard: ai.summaryCard,
        analysisContext: ai.analysisContext,
        flowContext: flowContext
          ? {
              currentDaYun: flowContext.currentDaYun,
              currentLiuNian: flowContext.currentLiuNian,
              liuNianTimeline: Array.isArray(flowContext.liuNianTimeline)
                ? flowContext.liuNianTimeline.slice(0, 3)
                : []
            }
          : ai.flowContext,
        premiumContext: premiumContext
          ? {
              unlocked: premiumContext.unlocked,
              sections: premiumContext.sections
                ? Object.fromEntries(
                    Object.entries(premiumContext.sections).map(([key, value]) => [
                      key,
                      typeof value === "object" && value
                        ? {
                            title: (value as { title?: string }).title,
                            summary: (value as { summary?: string }).summary
                          }
                        : value
                    ])
                  )
                : premiumContext.preview ?? premiumContext
            }
          : null
      }
    };
  }

  if (context.module === "liuyao" || ai.module === "liuyao" || context.module === "meihua" || ai.module === "meihua") {
    return compactDivinationContext(ai);
  }

  return context;
}

function stringifyContext(context: Record<string, unknown>) {
  const serialized = JSON.stringify(compactContextPayload(context), null, 2);

  if (serialized.length <= 8000) {
    return serialized;
  }

  return `${serialized.slice(0, 8000)}\n... [context truncated]`;
}

function buildMessages(input: AiConsultInput) {
  const context = input.context ?? {};
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: getSystemPrompt(input.module, context)
    },
    {
      role: "user",
      content: `以下是当前页面命理上下文，请严格据此回答：\n${stringifyContext(context)}`
    }
  ];

  for (const item of (input.history ?? []).slice(-6)) {
    messages.push({
      role: item.role,
      content: item.content
    });
  }

  messages.push({
    role: "user",
    content: input.question
  });

  return messages;
}

export async function consultWithDeepSeek(input: AiConsultInput) {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const response = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: input.model ?? env.DEEPSEEK_MODEL,
      thinking: {
        type: "disabled"
      },
      temperature: input.temperature ?? 0.6,
      max_tokens: input.maxTokens ?? 900,
      messages: buildMessages(input)
    })
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    id?: string;
    model?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    choices?: Array<{
      finish_reason?: string | null;
      message?: {
        role?: string;
        content?: string | null;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(data.error?.message || `DeepSeek request failed with ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("DeepSeek returned an empty response");
  }

  return {
    provider: "deepseek",
    model: data.model ?? input.model ?? env.DEEPSEEK_MODEL,
    responseId: data.id ?? null,
    finishReason: data.choices?.[0]?.finish_reason ?? null,
    answer: content,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? null,
      completionTokens: data.usage?.completion_tokens ?? null,
      totalTokens: data.usage?.total_tokens ?? null
    }
  };
}
