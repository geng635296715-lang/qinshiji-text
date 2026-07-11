import type { FastifyRequest } from "fastify";
import { getUserByToken } from "./service.js";

export function readBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export function getRequestUser(request: FastifyRequest) {
  const token = readBearerToken(request);
  if (!token) {
    return null;
  }

  return getUserByToken(token);
}
