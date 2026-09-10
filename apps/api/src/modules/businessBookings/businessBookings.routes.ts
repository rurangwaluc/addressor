import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import {
  createCustomerBookingHandler,
  getBookingHandler,
  getBookingSettingsHandler,
  listBookingsHandler,
  updateBookingNoteHandler,
  updateBookingSettingsHandler,
  updateBookingStatusHandler,
} from "./businessBookings.controller.js";

const verifiedPreHandler = [requireAuth, requireVerifiedUser()];

export default async function businessBookingsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/:businessId/bookings",
    { preHandler: verifiedPreHandler },
    createCustomerBookingHandler,
  );
  fastify.get("/:businessId/bookings/settings", { preHandler: verifiedPreHandler }, getBookingSettingsHandler);
  fastify.patch("/:businessId/bookings/settings", { preHandler: verifiedPreHandler }, updateBookingSettingsHandler);
  fastify.get("/:businessId/bookings", { preHandler: verifiedPreHandler }, listBookingsHandler);
  fastify.get("/:businessId/bookings/:bookingId", { preHandler: verifiedPreHandler }, getBookingHandler);
  fastify.patch("/:businessId/bookings/:bookingId/status", { preHandler: verifiedPreHandler }, updateBookingStatusHandler);
  fastify.patch("/:businessId/bookings/:bookingId/note", { preHandler: verifiedPreHandler }, updateBookingNoteHandler);
}
