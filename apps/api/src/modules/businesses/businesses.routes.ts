import { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import { createRateLimit } from "../../app/middleware/rateLimit.js";
import {
  businessOwnerSummaryHandler,
  completeBusinessOnboardingHandler,
  createBusinessProfileImageUploadHandler,
  featuredBusinessesHandler,
  myBusinessesHandler,
  updateBusinessProfileImageHandler,
  updateBusinessProfileHandler,
} from "./businesses.controller.js";

const profileImageUploadRateLimit = createRateLimit({
  name: "business:profile-image-upload",
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
});

export default async function businessesRoutes(fastify: FastifyInstance) {
  fastify.get("/featured", featuredBusinessesHandler);

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

  fastify.get(
    "/:businessId/owner-summary",
    {
      preHandler: [requireAuth, requireVerifiedUser()],
    },
    businessOwnerSummaryHandler,
  );

  fastify.patch(
    "/:businessId/profile",
    {
      preHandler: [requireAuth, requireVerifiedUser()],
    },
    updateBusinessProfileHandler,
  );

  fastify.post(
    "/:businessId/profile-image-upload",
    {
      preHandler: [
        requireAuth,
        requireVerifiedUser(),
        profileImageUploadRateLimit,
      ],
    },
    createBusinessProfileImageUploadHandler,
  );

  fastify.patch(
    "/:businessId/profile-image",
    {
      preHandler: [requireAuth, requireVerifiedUser()],
    },
    updateBusinessProfileImageHandler,
  );
}
