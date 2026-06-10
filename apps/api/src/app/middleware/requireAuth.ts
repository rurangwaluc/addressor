import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "../../modules/auth/auth.service.js";
import type { AuthUser } from "../../modules/auth/auth.types.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    authSession?: {
      id: string;
      expiresAt: Date;
      refreshExpiresAt: Date;
    };
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Missing Authorization" },
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Invalid Authorization format" },
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return reply.status(401).send({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Missing token" },
    });
  }

  const authenticated = await authService.authenticateAccessToken(token);

  req.user = authenticated.user;
  req.authSession = authenticated.session;
}