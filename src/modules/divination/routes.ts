import type { FastifyInstance } from "fastify";
import { z } from "zod";

const divinationSchema = z.object({
  method: z.enum(["liuyao", "meihua"]),
  topic: z.enum([
    "love",
    "career",
    "wealth",
    "health",
    "travel",
    "missing-item",
    "decision",
    "relationship",
    "other"
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  castingMode: z.string().min(1)
});

export async function registerDivinationRoutes(app: FastifyInstance) {
  app.post("/api/v1/divination/cast", async (request, reply) => {
    const parsed = divinationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid divination input",
        issues: parsed.error.issues
      });
    }

    const { method, topic, title, description, castingMode } = parsed.data;

    return {
      input: parsed.data,
      result: {
        method,
        topic,
        title,
        description,
        castingMode,
        primaryHexagram: "待实现",
        transformedHexagram: "待实现",
        summary: method === "liuyao"
          ? "这里将返回六爻本卦、变卦、动爻、世应与基础断语。"
          : "这里将返回梅花本卦、互卦、变卦、体用与五行生克判断。"
      }
    };
  });
}
