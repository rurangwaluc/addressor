import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import {
  getBusinessCapabilitiesHandler,
  updateBusinessCapabilitiesHandler,
} from "./businessCapabilities.controller.js";

const ownerPreHandler = [requireAuth, requireVerifiedUser()];

export default async function businessCapabilitiesRoutes(fastify: FastifyInstance) {
  fastify.get("/:businessId/capabilities", { preHandler: ownerPreHandler }, getBusinessCapabilitiesHandler);
  fastify.patch("/:businessId/capabilities", { preHandler: ownerPreHandler }, updateBusinessCapabilitiesHandler);
}
