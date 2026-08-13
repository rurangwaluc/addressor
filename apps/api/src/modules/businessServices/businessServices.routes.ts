import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import { createRateLimit } from "../../app/middleware/rateLimit.js";
import {
  confirmServiceImageHandler,
  createBusinessServiceHandler,
  createServiceImageUploadHandler,
  deleteBusinessServiceHandler,
  deleteServiceImageHandler,
  getBusinessServiceHandler,
  listBusinessServicesHandler,
  listPublicBusinessServicesHandler,
  updateBusinessServiceHandler,
} from "./businessServices.controller.js";

const ownerPreHandler = [requireAuth, requireVerifiedUser()];
const imageUploadRateLimit = createRateLimit({
  name: "business:service-image-upload",
  maxRequests: 30,
  windowMs: 15 * 60 * 1000,
});

export default async function businessServicesRoutes(fastify: FastifyInstance) {
  fastify.get("/:businessId/services/public", listPublicBusinessServicesHandler);
  fastify.get("/:businessId/services", { preHandler: ownerPreHandler }, listBusinessServicesHandler);
  fastify.post("/:businessId/services", { preHandler: ownerPreHandler }, createBusinessServiceHandler);
  fastify.get("/:businessId/services/:serviceId", { preHandler: ownerPreHandler }, getBusinessServiceHandler);
  fastify.patch("/:businessId/services/:serviceId", { preHandler: ownerPreHandler }, updateBusinessServiceHandler);
  fastify.delete("/:businessId/services/:serviceId", { preHandler: ownerPreHandler }, deleteBusinessServiceHandler);
  fastify.post(
    "/:businessId/services/:serviceId/image-upload",
    { preHandler: [...ownerPreHandler, imageUploadRateLimit] },
    createServiceImageUploadHandler,
  );
  fastify.post(
    "/:businessId/services/:serviceId/image-confirm",
    { preHandler: ownerPreHandler },
    confirmServiceImageHandler,
  );
  fastify.delete(
    "/:businessId/services/:serviceId/image",
    { preHandler: ownerPreHandler },
    deleteServiceImageHandler,
  );
}
