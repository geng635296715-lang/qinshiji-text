import type { FastifyInstance } from "fastify";

export async function registerMetaRoute(app: FastifyInstance) {
  app.get("/api/v1/meta", async () => {
    return {
      product: "青筮记",
      stage: "backend-first-draft",
      modules: ["bazi", "liuyao", "meihua", "qingzhi-advice", "ai-consultation"]
    };
  });
}
