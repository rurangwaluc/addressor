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

function sendUnauthorized(reply: FastifyReply, message: string) {
  return reply.status(401).send({
    ok: false,
    error: {
      code: "UNAUTHORIZED",
      message,
      statusCode: 401,
    },
  });
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendUnauthorized(reply, "Missing Authorization");
  }

  if (!authHeader.startsWith("Bearer ")) {
    return sendUnauthorized(reply, "Invalid Authorization format");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return sendUnauthorized(reply, "Missing token");
  }

  try {
    const authenticated = await authService.authenticateAccessToken(token);

    req.user = authenticated.user;
    req.authSession = authenticated.session;
  } catch {
    return sendUnauthorized(reply, "Invalid or expired session");
  }
}
