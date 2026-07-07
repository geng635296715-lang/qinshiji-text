import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { buildQingzhiAdviceAiView, buildQingzhiAdvicePageView } from "./presenter.js";
import {
  buildReminderPreview,
  getQingzhiCenterRecord,
  markQingzhiAdviceGenerated,
  saveQingzhiCenterProfile,
  saveQingzhiReminderSettings
} from "./profile-store.js";
import {
  buildQingzhiAdviceAiContext,
  generateQingzhiAdvice,
  type QingzhiAdviceInput
} from "./service.js";

const profileInputSchema = z.object({
  calendarType: z.enum(["solar", "lunar"]),
  birthDate: z.string(),
  birthTime: z.string(),
  gender: z.enum(["male", "female", "other"]),
  birthPlace: z.string().min(1)
});

const adviceSchema: z.ZodType<QingzhiAdviceInput> = z.object({
  userId: z.string().min(1).optional(),
  scope: z.enum(["daily", "monthly"]),
  date: z.string(),
  profile: profileInputSchema
});

const profileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1).optional(),
  profile: profileInputSchema
});

const reminderSchema = z.object({
  userId: z.string().min(1),
  reminderSettings: z.object({
    dailyEnabled: z.boolean(),
    dailyTime: z.string().regex(/^\d{2}:\d{2}$/),
    monthlyEnabled: z.boolean(),
    monthlyDay: z.number().int().min(1).max(28),
    channel: z.enum(["site", "email", "sms"])
  })
});

const archiveGenerateSchema = z.object({
  userId: z.string().min(1),
  scope: z.enum(["daily", "monthly"]),
  date: z.string()
});

export async function registerQingzhiAdviceRoutes(app: FastifyInstance) {
  app.get("/api/v1/qingzhi-advice/center/:userId", async (request, reply) => {
    const params = z.object({ userId: z.string().min(1) }).safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({
        message: "Invalid user id",
        issues: params.error.issues
      });
    }

    const record = await getQingzhiCenterRecord(params.data.userId);

    return {
      userId: params.data.userId,
      hasProfile: Boolean(record),
      archive: record,
      reminderPreview: buildReminderPreview(record)
    };
  });

  app.post("/api/v1/qingzhi-advice/center/save-profile", async (request, reply) => {
    const parsed = profileSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid profile payload",
        issues: parsed.error.issues
      });
    }

    const record = await saveQingzhiCenterProfile(parsed.data);
    return {
      message: "Profile saved",
      archive: record,
      reminderPreview: buildReminderPreview(record)
    };
  });

  app.post("/api/v1/qingzhi-advice/center/save-reminder", async (request, reply) => {
    const parsed = reminderSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid reminder payload",
        issues: parsed.error.issues
      });
    }

    try {
      const record = await saveQingzhiReminderSettings(parsed.data);
      return {
        message: "Reminder settings saved",
        archive: record,
        reminderPreview: buildReminderPreview(record)
      };
    } catch (error) {
      return reply.status(404).send({
        message: error instanceof Error ? error.message : "Failed to save reminder settings"
      });
    }
  });

  app.post("/api/v1/qingzhi-advice/generate-from-profile", async (request, reply) => {
    const parsed = archiveGenerateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid generate-from-profile payload",
        issues: parsed.error.issues
      });
    }

    const record = await getQingzhiCenterRecord(parsed.data.userId);

    if (!record) {
      return reply.status(404).send({
        message: "User archive not found"
      });
    }

    const input: QingzhiAdviceInput = {
      userId: parsed.data.userId,
      scope: parsed.data.scope,
      date: parsed.data.date,
      profile: record.profile
    };

    try {
      const result = generateQingzhiAdvice(input);
      const aiContext = buildQingzhiAdviceAiContext(result);
      const updatedRecord = await markQingzhiAdviceGenerated({
        userId: parsed.data.userId,
        scope: parsed.data.scope,
        date: parsed.data.date
      });

      return {
        result,
        view: buildQingzhiAdvicePageView(result),
        aiContext,
        aiView: buildQingzhiAdviceAiView(aiContext),
        archive: updatedRecord ?? record,
        reminderPreview: buildReminderPreview(updatedRecord ?? record)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to generate advice from profile"
      });
    }
  });

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
