import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { requireVerifiedUser } from "../../app/middleware/requireRole.js";
import {
  getBookingHandler,
  getBookingSettingsHandler,
  listBookingsHandler,
  updateBookingNoteHandler,
  updateBookingSettingsHandler,
  updateBookingStatusHandler,
} from "./businessBookings.controller.js";

const ownerPreHandler = [requireAuth, requireVerifiedUser()];

export default async function businessBookingsRoutes(fastify: FastifyInstance) {
  fastify.get("/:businessId/bookings/settings", { preHandler: ownerPreHandler }, getBookingSettingsHandler);
  fastify.patch("/:businessId/bookings/settings", { preHandler: ownerPreHandler }, updateBookingSettingsHandler);
  fastify.get("/:businessId/bookings", { preHandler: ownerPreHandler }, listBookingsHandler);
  fastify.get("/:businessId/bookings/:bookingId", { preHandler: ownerPreHandler }, getBookingHandler);
  fastify.patch("/:businessId/bookings/:bookingId/status", { preHandler: ownerPreHandler }, updateBookingStatusHandler);
  fastify.patch("/:businessId/bookings/:bookingId/note", { preHandler: ownerPreHandler }, updateBookingNoteHandler);
}
