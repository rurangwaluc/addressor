import type { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { businessBookingsService } from "./businessBookings.service.js";
import {
  BusinessBookingListQuerySchema,
  BusinessBookingNoteUpdateSchema,
  BusinessBookingParamsSchema,
  BusinessBookingRequestParamsSchema,
  BusinessBookingSettingsUpdateSchema,
  BusinessBookingStatusUpdateSchema,
} from "./businessBookings.validators.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) throw new Error("Invalid token");
  return request.user;
}

export async function getBookingSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessBookingParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessBookingsService.getSettings(user.id, businessId)));
}

export async function updateBookingSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessBookingParamsSchema.parse(request.params);
  const body = BusinessBookingSettingsUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessBookingsService.updateSettings(user.id, businessId, body)));
}

export async function listBookingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessBookingParamsSchema.parse(request.params);
  const query = BusinessBookingListQuerySchema.parse(request.query);
  return reply.send(okResponse(await businessBookingsService.list(user.id, businessId, query)));
}

export async function getBookingHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, bookingId } = BusinessBookingRequestParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessBookingsService.getById(user.id, businessId, bookingId)));
}

export async function updateBookingStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, bookingId } = BusinessBookingRequestParamsSchema.parse(request.params);
  const body = BusinessBookingStatusUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessBookingsService.updateStatus(user.id, businessId, bookingId, body)));
}

export async function updateBookingNoteHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, bookingId } = BusinessBookingRequestParamsSchema.parse(request.params);
  const body = BusinessBookingNoteUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessBookingsService.updateNote(user.id, businessId, bookingId, body)));
}
