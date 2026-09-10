import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import {
  createBookingReviewHandler,
  createOrderReviewHandler,
  updateBookingReviewHandler,
  updateOrderReviewHandler,
} from "../businessReviews/businessReviews.controller.js";
import {
  getCustomerBookingHandler,
  getCustomerOrderHandler,
  listCustomerBookingsHandler,
  listCustomerOrdersHandler,
} from "./customerAccount.controller.js";

const verifiedPreHandler = [
  requireAuth,
  requireVerifiedUser(),
];

export default async function customerAccountRoutes(
  fastify: FastifyInstance,
) {
  fastify.get(
    "/bookings",
    { preHandler: requireAuth },
    listCustomerBookingsHandler,
  );

  fastify.get(
    "/bookings/:bookingId",
    { preHandler: requireAuth },
    getCustomerBookingHandler,
  );

  fastify.get(
    "/orders",
    { preHandler: requireAuth },
    listCustomerOrdersHandler,
  );

  fastify.get(
    "/orders/:orderId",
    { preHandler: requireAuth },
    getCustomerOrderHandler,
  );

  fastify.post(
    "/orders/:orderId/review",
    { preHandler: verifiedPreHandler },
    createOrderReviewHandler,
  );

  fastify.patch(
    "/orders/:orderId/review",
    { preHandler: verifiedPreHandler },
    updateOrderReviewHandler,
  );

  fastify.post(
    "/bookings/:bookingId/review",
    { preHandler: verifiedPreHandler },
    createBookingReviewHandler,
  );

  fastify.patch(
    "/bookings/:bookingId/review",
    { preHandler: verifiedPreHandler },
    updateBookingReviewHandler,
  );
}
