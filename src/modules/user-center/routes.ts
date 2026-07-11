import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getRequestUser } from "../../shared/auth/request.js";
import {
  createBaziArchiveForUser,
  deleteBaziArchiveForUser,
  getBaziArchiveByIdForUser,
  getUserCenterOverview,
  listBaziArchivesForUser,
  saveReminderSettingsForUser,
  updateBaziArchiveForUser,
  upsertBaziProfileForUser
} from "./service.js";
import { analyzeBazi } from "../bazi/service.js";

const reminderSchema = z.object({
  dailyEnabled: z.boolean(),
  dailyTime: z.string().regex(/^\d{2}:\d{2}$/),
  monthlyEnabled: z.boolean(),
  monthlyDay: z.number().int().min(1).max(28),
  channel: z.enum(["site", "email", "sms"])
});

const baziProfileSchema = z.object({
  calendarType: z.enum(["solar", "lunar"]),
  birthDate: z.string(),
  birthTime: z.string(),
  gender: z.enum(["male", "female", "other"]),
  birthPlace: z.string().min(1),
  focusYear: z.number().int().optional(),
  isVip: z.boolean().optional().default(true)
});

const baziArchiveSchema = z.object({
  nickname: z.string().min(1).max(40),
  calendarType: z.enum(["solar", "lunar"]),
  birthDate: z.string(),
  birthTime: z.string(),
  gender: z.enum(["male", "female", "other"]),
  birthPlace: z.string().min(1),
  note: z.string().max(120).optional()
});

export async function registerUserCenterRoutes(app: FastifyInstance) {
  app.get("/api/v1/user-center/overview", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    return {
      user,
      overview: getUserCenterOverview(user.id)
    };
  });

  app.post("/api/v1/user-center/bazi-profile", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = baziProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi profile payload",
        issues: parsed.error.issues
      });
    }

    try {
      const analysis = analyzeBazi(parsed.data);
      upsertBaziProfileForUser({
        userId: user.id,
        profile: parsed.data,
        analysisSnapshot: analysis
      });

      return {
        message: "Bazi profile saved",
        result: analysis,
        overview: getUserCenterOverview(user.id)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to save bazi profile"
      });
    }
  });

  app.get("/api/v1/user-center/bazi-archives", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    return {
      archives: listBaziArchivesForUser(user.id)
    };
  });

  app.get("/api/v1/user-center/bazi-archives/:archiveId", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = z.object({ archiveId: z.string().min(1) }).safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid archive id",
        issues: parsed.error.issues
      });
    }

    const archive = getBaziArchiveByIdForUser(user.id, parsed.data.archiveId);
    if (!archive) {
      return reply.status(404).send({ message: "Archive not found" });
    }

    return { archive };
  });

  app.post("/api/v1/user-center/bazi-archives", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = baziArchiveSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi archive payload",
        issues: parsed.error.issues
      });
    }

    try {
      const archive = createBaziArchiveForUser({
        userId: user.id,
        nickname: parsed.data.nickname,
        profile: parsed.data
      });

      return {
        message: "Bazi archive saved",
        archive,
        archives: listBaziArchivesForUser(user.id)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to save bazi archive"
      });
    }
  });

  app.patch("/api/v1/user-center/bazi-archives/:archiveId", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const paramsParsed = z.object({ archiveId: z.string().min(1) }).safeParse(request.params);
    if (!paramsParsed.success) {
      return reply.status(400).send({
        message: "Invalid archive id",
        issues: paramsParsed.error.issues
      });
    }

    const bodyParsed = baziArchiveSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      return reply.status(400).send({
        message: "Invalid bazi archive payload",
        issues: bodyParsed.error.issues
      });
    }

    try {
      const archive = updateBaziArchiveForUser({
        userId: user.id,
        archiveId: paramsParsed.data.archiveId,
        nickname: bodyParsed.data.nickname,
        profile: bodyParsed.data
      });

      if (!archive) {
        return reply.status(404).send({ message: "Archive not found" });
      }

      return {
        message: "Bazi archive updated",
        archive,
        archives: listBaziArchivesForUser(user.id)
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Failed to update bazi archive"
      });
    }
  });

  app.delete("/api/v1/user-center/bazi-archives/:archiveId", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = z.object({ archiveId: z.string().min(1) }).safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid archive id",
        issues: parsed.error.issues
      });
    }

    const deleted = deleteBaziArchiveForUser(user.id, parsed.data.archiveId);
    if (!deleted) {
      return reply.status(404).send({ message: "Archive not found" });
    }

    return {
      message: "Bazi archive deleted",
      archives: listBaziArchivesForUser(user.id)
    };
  });

  app.post("/api/v1/user-center/reminder-settings", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const parsed = reminderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid reminder settings payload",
        issues: parsed.error.issues
      });
    }

    return {
      reminderSettings: saveReminderSettingsForUser(user.id, parsed.data),
      overview: getUserCenterOverview(user.id)
    };
  });
}
