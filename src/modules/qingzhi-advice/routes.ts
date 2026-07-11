import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getRequestUser } from "../../shared/auth/request.js";
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
  displayName: z.string().min(1).optional(),
  profile: profileInputSchema
});

const reminderSchema = z.object({
  reminderSettings: z.object({
    dailyEnabled: z.boolean(),
    dailyTime: z.string().regex(/^\d{2}:\d{2}$/),
    monthlyEnabled: z.boolean(),
    monthlyDay: z.number().int().min(1).max(28),
    channel: z.enum(["site", "email", "sms"])
  })
});

const archiveGenerateSchema = z.object({
  scope: z.enum(["daily", "monthly"]),
  date: z.string()
});

export async function registerQingzhiAdviceRoutes(app: FastifyInstance) {
  app.get("/api/v1/qingzhi-advice/center", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const record = await getQingzhiCenterRecord(user.id);

    return {
      user,
      hasProfile: Boolean(record),
      archive: record,
      reminderPreview: buildReminderPreview(record)
    };
  });

  app.get("/api/v1/qingzhi-advice/center/:userId", async (request, reply) => {
    const user = getRequestUser(request);
    const params = z.object({ userId: z.string().min(1) }).safeParse(request.params);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    if (!params.success || params.data.userId !== user.id) {
      return reply.status(403).send({ message: "Forbidden" });
    }

    const record = await getQingzhiCenterRecord(user.id);

    return {
      user,
      hasProfile: Boolean(record),
      archive: record,
      reminderPreview: buildReminderPreview(record)
    };
  });

  app.post("/api/v1/qingzhi-advice/center/save-profile", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = profileSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid profile payload",
        issues: parsed.error.issues
      });
    }

    const record = await saveQingzhiCenterProfile({
      userId: user.id,
      displayName: parsed.data.displayName,
      profile: parsed.data.profile
    });

    return {
      message: "Profile saved",
      archive: record,
      reminderPreview: buildReminderPreview(record)
    };
  });

  app.post("/api/v1/qingzhi-advice/center/save-reminder", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = reminderSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid reminder payload",
        issues: parsed.error.issues
      });
    }

    const record = await saveQingzhiReminderSettings({
      userId: user.id,
      reminderSettings: parsed.data.reminderSettings
    });

    if (!record) {
      return reply.status(404).send({
        message: "User archive not found"
      });
    }

    return {
      message: "Reminder settings saved",
      archive: record,
      reminderPreview: buildReminderPreview(record)
    };
  });

  app.post("/api/v1/qingzhi-advice/generate-from-profile", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = archiveGenerateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid generate-from-profile payload",
        issues: parsed.error.issues
      });
    }

    const record = await getQingzhiCenterRecord(user.id);

    if (!record) {
      return reply.status(404).send({
        message: "User archive not found"
      });
    }

    const input: QingzhiAdviceInput = {
      userId: user.id,
      scope: parsed.data.scope,
      date: parsed.data.date,
      profile: record.profile
    };

    try {
      const result = generateQingzhiAdvice(input);
      const aiContext = buildQingzhiAdviceAiContext(result);
      const updatedRecord = await markQingzhiAdviceGenerated({
        userId: user.id,
        scope: parsed.data.scope,
        date: parsed.data.date,
        result
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
