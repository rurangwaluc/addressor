import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import {
  createCustomerOrderHandler,
  getOrderHandler,
  getOrderSettingsHandler,
  listOrdersHandler,
  updateOrderNoteHandler,
  updateOrderSettingsHandler,
  updateOrderStatusHandler,
} from "./businessOrders.controller.js";

const verifiedPreHandler = [requireAuth, requireVerifiedUser()];

export default async function businessOrdersRoutes(fastify: FastifyInstance) {
  fastify.post("/:businessId/orders", { preHandler: verifiedPreHandler }, createCustomerOrderHandler);
  fastify.get("/:businessId/orders/settings", { preHandler: verifiedPreHandler }, getOrderSettingsHandler);
  fastify.patch("/:businessId/orders/settings", { preHandler: verifiedPreHandler }, updateOrderSettingsHandler);
  fastify.get("/:businessId/orders", { preHandler: verifiedPreHandler }, listOrdersHandler);
  fastify.get("/:businessId/orders/:orderId", { preHandler: verifiedPreHandler }, getOrderHandler);
  fastify.patch("/:businessId/orders/:orderId/status", { preHandler: verifiedPreHandler }, updateOrderStatusHandler);
  fastify.patch("/:businessId/orders/:orderId/note", { preHandler: verifiedPreHandler }, updateOrderNoteHandler);
}
