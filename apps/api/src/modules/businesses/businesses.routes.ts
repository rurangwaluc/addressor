import { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import {
  completeBusinessOnboardingHandler,
  myBusinessesHandler,
  updateBusinessProfileHandler,
} from "./businesses.controller.js";

export default async function businessesRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/onboarding",
    {
      preHandler: [requireAuth, requireVerifiedUser()],
    },
    completeBusinessOnboardingHandler,
  );

  fastify.get(
    "/my",
    {
      preHandler: [requireAuth],
    },
    myBusinessesHandler,
  );

  fastify.patch(
    "/:businessId/profile",
    {
      preHandler: [requireAuth, requireVerifiedUser()],
    },
    updateBusinessProfileHandler,
  );
}
