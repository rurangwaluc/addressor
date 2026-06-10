import { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requirePlatformRole } from "../../app/middleware/requirePlatformRole.js";
import { platformMeHandler } from "./platform.controller.js";

export default async function platformRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    {
      preHandler: [
        requireAuth,
        requirePlatformRole([
          "platform_owner",
          "platform_admin",
          "platform_support",
        ]),
      ],
    },
    platformMeHandler,
  );
}