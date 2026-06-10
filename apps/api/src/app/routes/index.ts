import { FastifyInstance } from "fastify";
import authRoutes from "../../modules/auth/auth.routes.js";
import platformRoutes from "../../modules/platform/platform.routes.js";
import businessAccessRoutes from "../../modules/businessAccess/businessAccess.routes.js";

export default async function appRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(platformRoutes, { prefix: "/platform" });
  await fastify.register(businessAccessRoutes, { prefix: "/business" });
}