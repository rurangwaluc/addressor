import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import {
  getBusinessReviewHandler,
  listBusinessReviewsHandler,
  listPublicBusinessReviewsHandler,
  updateBusinessReviewReplyHandler,
} from "./businessReviews.controller.js";

const verifiedPreHandler = [
  requireAuth,
  requireVerifiedUser(),
];

export default async function businessReviewsRoutes(
  fastify: FastifyInstance,
) {
  fastify.get(
    "/public/:slug/reviews",
    listPublicBusinessReviewsHandler,
  );

  fastify.get(
    "/:businessId/reviews",
    { preHandler: verifiedPreHandler },
    listBusinessReviewsHandler,
  );

  fastify.get(
    "/:businessId/reviews/:reviewId",
    { preHandler: verifiedPreHandler },
    getBusinessReviewHandler,
  );

  fastify.patch(
    "/:businessId/reviews/:reviewId/reply",
    { preHandler: verifiedPreHandler },
    updateBusinessReviewReplyHandler,
  );
}
