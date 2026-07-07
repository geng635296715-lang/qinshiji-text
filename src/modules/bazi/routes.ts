import type { FastifyInstance } from "fastify";
import { z } from "zod";
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
      return {
        result: analyzeBazi(parsed.data)
      };
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
}
