import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getRequestUser } from "../../shared/auth/request.js";
import { saveAiConsultationRecordForUser } from "../user-center/service.js";
import { consultWithDeepSeek } from "./service.js";

const aiConsultSchema = z.object({
  module: z.enum(["bazi", "liuyao", "meihua", "qingzhi-advice"]),
  sessionId: z.string().min(1),
  question: z.string().min(1),
  context: z.record(z.string(), z.unknown()).default({}),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1)
  })).optional(),
  model: z.string().min(1).optional(),
  maxTokens: z.number().int().min(64).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional()
});

export async function registerAiRoutes(app: FastifyInstance) {
  app.post("/api/v1/ai/consult", async (request, reply) => {
    const parsed = aiConsultSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid AI consult request",
        issues: parsed.error.issues
      });
    }

    try {
      const result = await consultWithDeepSeek(parsed.data);
      const user = getRequestUser(request);
      if (user) {
        saveAiConsultationRecordForUser({
          userId: user.id,
          module: parsed.data.module,
          sessionId: parsed.data.sessionId,
          question: parsed.data.question,
          answer: result.answer,
          model: parsed.data.model ?? result.model,
          context: parsed.data.context,
          history: parsed.data.history
        });
      }

      return {
        input: {
          module: parsed.data.module,
          sessionId: parsed.data.sessionId,
          question: parsed.data.question,
          model: parsed.data.model ?? result.model
        },
        result,
        contextGuide:
          parsed.data.module === "qingzhi-advice"
            ? {
                recommendedContextEndpoint: "/api/v1/qingzhi-advice/ai-context",
                note: "建议前端先取青筮建议专用上下文，再调用本接口进行多轮咨询。"
              }
            : parsed.data.module === "bazi"
              ? {
                  recommendedContextEndpoint: "/api/v1/bazi/ai-context",
                  note: "建议前端先取八字专用上下文，再调用本接口进行咨询。"
                }
              : parsed.data.module === "liuyao"
                ? {
                    recommendedContextEndpoint: "/api/v1/liuyao/ai-context",
                    note: "建议前端先取六爻专用上下文，再调用本接口做详细追问。"
                  }
                : parsed.data.module === "meihua"
                  ? {
                      recommendedContextEndpoint: "/api/v1/meihua/ai-context",
                      note: "建议前端先取梅花易数专用上下文，再调用本接口做详细追问。"
                    }
              : {
                  note: "当前模块可沿用通用 context 透传。"
                }
      };
    } catch (error) {
      return reply.status(500).send({
        message: error instanceof Error ? error.message : "AI consult failed"
      });
    }
  });
}
