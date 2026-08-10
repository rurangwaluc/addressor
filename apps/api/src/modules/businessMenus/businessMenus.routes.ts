import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import { createRateLimit } from "../../app/middleware/rateLimit.js";
import {
  confirmMenuUploadHandler,
  createMenuDraftHandler,
  getOwnerMenuHandler,
  getPublicMenuHandler,
  publishMenuHandler,
  reorderMenuFilesHandler,
  removeMenuFileHandler,
  requestMenuUploadHandler,
  unpublishMenuHandler,
} from "./businessMenus.controller.js";

const uploadRateLimit = createRateLimit({
  name: "business:menu-upload",
  maxRequests: 40,
  windowMs: 15 * 60 * 1000,
});
const ownerPreHandler = [requireAuth, requireVerifiedUser()];

export default async function businessMenusRoutes(fastify: FastifyInstance) {
  fastify.get("/:businessId/menu/public", getPublicMenuHandler);
  fastify.get("/:businessId/menu", { preHandler: ownerPreHandler }, getOwnerMenuHandler);
  fastify.post("/:businessId/menu/drafts", { preHandler: ownerPreHandler }, createMenuDraftHandler);
  fastify.post(
    "/:businessId/menu/revisions/:revisionId/upload",
    { preHandler: [...ownerPreHandler, uploadRateLimit] },
    requestMenuUploadHandler,
  );
  fastify.post(
    "/:businessId/menu/revisions/:revisionId/files/:fileId/confirm",
    { preHandler: ownerPreHandler },
    confirmMenuUploadHandler,
  );
  fastify.delete(
    "/:businessId/menu/revisions/:revisionId/files/:fileId",
    { preHandler: ownerPreHandler },
    removeMenuFileHandler,
  );
  fastify.patch(
    "/:businessId/menu/revisions/:revisionId/files/order",
    { preHandler: ownerPreHandler },
    reorderMenuFilesHandler,
  );
  fastify.post(
    "/:businessId/menu/revisions/:revisionId/publish",
    { preHandler: ownerPreHandler },
    publishMenuHandler,
  );
  fastify.post(
    "/:businessId/menu/unpublish",
    { preHandler: ownerPreHandler },
    unpublishMenuHandler,
  );
}
