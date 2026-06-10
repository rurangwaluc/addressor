import { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireBusinessAccess } from "../../app/middleware/requireBusinessAccess.js";
import { businessMeHandler } from "./businessAccess.controller.js";

export default async function businessAccessRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    {
      preHandler: [requireAuth, requireBusinessAccess],
    },
    businessMeHandler,
  );
}