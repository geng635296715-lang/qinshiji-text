import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      ok: true,
      service: "qinshiji-backend",
      timestamp: new Date().toISOString()
    };
  });
}
