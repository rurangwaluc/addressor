import { FastifyInstance } from "fastify";
import authRoutes from "../../modules/auth/auth.routes.js";
import platformRoutes from "../../modules/platform/platform.routes.js";
import businessAccessRoutes from "../../modules/businessAccess/businessAccess.routes.js";
import businessesRoutes from "../../modules/businesses/businesses.routes.js";
import businessMenusRoutes from "../../modules/businessMenus/businessMenus.routes.js";

export default async function appRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(platformRoutes, { prefix: "/platform" });
  await fastify.register(businessAccessRoutes, { prefix: "/business" });
  await fastify.register(businessesRoutes, { prefix: "/businesses" });
  await fastify.register(businessMenusRoutes, { prefix: "/businesses" });
}
