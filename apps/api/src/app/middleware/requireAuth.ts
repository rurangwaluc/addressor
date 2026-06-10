import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      phone?: string;
    };
  }
}

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ error: "Missing Authorization" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Invalid Authorization format" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return reply.status(401).send({ error: "Missing token" });
  }

  if (!token.startsWith("dev-token:")) {
    return reply.status(401).send({ error: "Invalid token" });
  }

  const userId = token.replace("dev-token:", "").trim();

  if (!userId) {
    return reply.status(401).send({ error: "Invalid token" });
  }

  req.user = {
    id: userId,
  };
}