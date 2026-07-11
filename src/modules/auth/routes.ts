import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getRequestUser, readBearerToken } from "../../shared/auth/request.js";
import { loginUser, logoutByToken, registerUser } from "../../shared/auth/service.js";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128),
  displayName: z.string().min(1).max(48).optional()
});

const loginSchema = z.object({
  account: z.string().min(1),
  password: z.string().min(1)
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid register payload",
        issues: parsed.error.issues
      });
    }

    try {
      const user = registerUser(parsed.data);
      const session = loginUser({
        account: parsed.data.email,
        password: parsed.data.password
      }).session;

      return {
        user,
        session
      };
    } catch (error) {
      return reply.status(400).send({
        message: error instanceof Error ? error.message : "Register failed"
      });
    }
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid login payload",
        issues: parsed.error.issues
      });
    }

    try {
      return loginUser(parsed.data);
    } catch (error) {
      return reply.status(401).send({
        message: error instanceof Error ? error.message : "Login failed"
      });
    }
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    const user = getRequestUser(request);

    if (!user) {
      return reply.status(401).send({
        message: "Unauthorized"
      });
    }

    return { user };
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const token = readBearerToken(request);
    if (token) {
      logoutByToken(token);
    }

    return {
      ok: true
    };
  });
}
