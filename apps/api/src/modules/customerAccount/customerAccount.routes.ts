import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import {
  getCustomerBookingHandler,
  getCustomerOrderHandler,
  listCustomerBookingsHandler,
  listCustomerOrdersHandler,
} from "./customerAccount.controller.js";

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
}
