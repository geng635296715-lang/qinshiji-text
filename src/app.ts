import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerAiRoutes } from "./modules/ai/routes.js";
import { registerBaziRoutes } from "./modules/bazi/routes.js";
import { registerDivinationRoutes } from "./modules/divination/routes.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import { registerQingzhiAdviceRoutes } from "./modules/qingzhi-advice/routes.js";
import { registerMetaRoute } from "./shared/http/meta-route.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });

  app.register(registerHealthRoutes);
  app.register(registerMetaRoute);
  app.register(registerBaziRoutes);
  app.register(registerDivinationRoutes);
  app.register(registerQingzhiAdviceRoutes);
  app.register(registerAiRoutes);

  return app;
}
