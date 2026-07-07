import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DivinationTopic } from "../../shared/types/domain.js";
import {
  buildLiuyaoAiContext,
  buildMeihuaAiContext,
  castLiuyao,
  castMeihua
} from "./service.js";
import {
  buildDivinationAiView,
  buildLiuyaoPageView,
  buildMeihuaPageView
} from "./presenter.js";

const topicSchema = z.enum([
  "love",
  "career",
  "wealth",
  "health",
  "travel",
  "missing-item",
  "decision",
  "relationship",
  "other"
] satisfies [DivinationTopic, ...DivinationTopic[]]);

const liuyaoLineSchema = z.enum(["old-yin", "young-yang", "young-yin", "old-yang"]);

const liuyaoSchema = z.object({
  topic: topicSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  castingMode: z.enum(["auto", "manual"]),
  occurredAt: z.string().optional(),
  lines: z.array(liuyaoLineSchema).length(6).optional()
});

const meihuaSchema = z.object({
  topic: topicSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  castingMode: z.enum(["numbers", "time"]),
  timeMethod: z.enum(["ymd", "ymdh", "ymdhm", "lunar-ymdh"]).optional(),
  numbers: z.array(z.number().int()).min(2).max(3).optional(),
  occurredAt: z.string().optional(),
  externalOmen: z
    .object({
      direction: z.string().optional(),
      sound: z.string().optional(),
      color: z.string().optional(),
      motion: z.string().optional(),
      countNumber: z.number().int().optional(),
      touchedObject: z.string().optional(),
      scene: z.string().optional()
    })
    .optional()
});

export async function registerDivinationRoutes(app: FastifyInstance) {
  app.post("/api/v1/liuyao/cast", async (request, reply) => {
    const parsed = liuyaoSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid liuyao input",
        issues: parsed.error.issues
      });
    }

    try {
      return {
        result: castLiuyao(parsed.data)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to cast liuyao"
      });
    }
  });

  app.post("/api/v1/liuyao/cast-view", async (request, reply) => {
    const parsed = liuyaoSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid liuyao input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = castLiuyao(parsed.data);
      return {
        result,
        view: buildLiuyaoPageView(result)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build liuyao page view"
      });
    }
  });

  app.post("/api/v1/liuyao/ai-context", async (request, reply) => {
    const parsed = liuyaoSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid liuyao input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = castLiuyao(parsed.data);
      const aiContext = buildLiuyaoAiContext(result);

      return {
        result,
        aiContext,
        aiView: buildDivinationAiView(aiContext)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build liuyao AI context"
      });
    }
  });

  app.post("/api/v1/meihua/cast", async (request, reply) => {
    const parsed = meihuaSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid meihua input",
        issues: parsed.error.issues
      });
    }

    try {
      return {
        result: castMeihua(parsed.data)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to cast meihua"
      });
    }
  });

  app.post("/api/v1/meihua/cast-view", async (request, reply) => {
    const parsed = meihuaSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid meihua input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = castMeihua(parsed.data);
      return {
        result,
        view: buildMeihuaPageView(result)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build meihua page view"
      });
    }
  });

  app.post("/api/v1/meihua/ai-context", async (request, reply) => {
    const parsed = meihuaSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid meihua input",
        issues: parsed.error.issues
      });
    }

    try {
      const result = castMeihua(parsed.data);
      const aiContext = buildMeihuaAiContext(result);

      return {
        result,
        aiContext,
        aiView: buildDivinationAiView(aiContext)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to build meihua AI context"
      });
    }
  });
}
