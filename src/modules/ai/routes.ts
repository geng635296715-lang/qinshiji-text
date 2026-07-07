import type { FastifyInstance } from "fastify";
import { z } from "zod";

const aiConsultSchema = z.object({
  module: z.enum(["bazi", "liuyao", "meihua", "qingzhi-advice"]),
  sessionId: z.string().min(1),
  question: z.string().min(1),
  context: z.record(z.string(), z.unknown()).default({})
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

    return {
      input: parsed.data,
      providerPlan: {
        currentMode: "stub",
        supportedProviders: ["openai", "deepseek"],
        note: "这里先返回 AI 咨询上下文骨架，后续再接真实模型路由与成本控制。"
      }
    };
  });
}
