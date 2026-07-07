import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { buildQingzhiAdviceAiView, buildQingzhiAdvicePageView } from "./presenter.js";
import {
  buildQingzhiAdviceAiContext,
  generateQingzhiAdvice,
  type QingzhiAdviceInput
} from "./service.js";

const adviceSchema: z.ZodType<QingzhiAdviceInput> = z.object({
  userId: z.string().min(1).optional(),
  scope: z.enum(["daily", "monthly"]),
  date: z.string(),
  profile: z.object({
    calendarType: z.enum(["solar", "lunar"]),
    birthDate: z.string(),
    birthTime: z.string(),
    gender: z.enum(["male", "female", "other"]),
    birthPlace: z.string().min(1)
  })
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

    try {
      return {
        result: generateQingzhiAdvice(parsed.data)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to generate qingzhi advice"
      });
    }
  });

  app.post("/api/v1/qingzhi-advice/generate-view", async (request, reply) => {
    const parsed = adviceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid advice request",
        issues: parsed.error.issues
      });
    }

    try {
      const result = generateQingzhiAdvice(parsed.data);
      return {
        result,
        view: buildQingzhiAdvicePageView(result)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build qingzhi advice view"
      });
    }
  });

  app.post("/api/v1/qingzhi-advice/ai-context", async (request, reply) => {
    const parsed = adviceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid advice request",
        issues: parsed.error.issues
      });
    }

    try {
      const result = generateQingzhiAdvice(parsed.data);
      const aiContext = buildQingzhiAdviceAiContext(result);

      return {
        result,
        aiContext,
        aiView: buildQingzhiAdviceAiView(aiContext)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build qingzhi advice AI context"
      });
    }
  });
}
