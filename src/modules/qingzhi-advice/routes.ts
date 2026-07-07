import type { FastifyInstance } from "fastify";
import { z } from "zod";

const adviceSchema = z.object({
  userId: z.string().min(1),
  scope: z.enum(["daily", "monthly"]),
  date: z.string()
});

export async function registerQingzhiAdviceRoutes(app: FastifyInstance) {
  app.post("/api/v1/qingzhi-advice/generate", async (request, reply) => {
    const parsed = adviceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid advice request",
        issues: parsed.error.issues
      });
    }

    return {
      input: parsed.data,
      advice: {
        overview: parsed.data.scope === "daily" ? "今日运势建议待实现" : "本月运势建议待实现",
        recommendedColors: ["青色", "米白"],
        recommendedStyle: "简净、沉稳、利落",
        accessorySuggestion: "这里将返回基于八字喜忌与时令的配饰建议。",
        dos: ["宜沟通", "宜整理", "宜观察时机"],
        donts: ["忌冲动决断", "忌情绪化表达"]
      }
    };
  });
}
