import type { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { businessOrdersService } from "./businessOrders.service.js";
import {
  BusinessOrderCreateSchema,
  BusinessOrderItemParamsSchema,
  BusinessOrderListQuerySchema,
  BusinessOrderNoteUpdateSchema,
  BusinessOrderParamsSchema,
  BusinessOrderSettingsUpdateSchema,
  BusinessOrderStatusUpdateSchema,
} from "./businessOrders.validators.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) throw new Error("Invalid token");
  return request.user;
}

export async function createCustomerOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessOrderParamsSchema.parse(request.params);
  const body = BusinessOrderCreateSchema.parse(request.body);
  const result = await businessOrdersService.createCustomerOrder(user, businessId, body);
  return reply.status(201).send(okResponse(result));
}

export async function getOrderSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessOrderParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessOrdersService.getSettings(user.id, businessId)));
}

export async function updateOrderSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessOrderParamsSchema.parse(request.params);
  const body = BusinessOrderSettingsUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessOrdersService.updateSettings(user.id, businessId, body)));
}

export async function listOrdersHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessOrderParamsSchema.parse(request.params);
  const query = BusinessOrderListQuerySchema.parse(request.query);
  return reply.send(okResponse(await businessOrdersService.list(user.id, businessId, query)));
}

export async function getOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, orderId } = BusinessOrderItemParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessOrdersService.getById(user.id, businessId, orderId)));
}

export async function updateOrderStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, orderId } = BusinessOrderItemParamsSchema.parse(request.params);
  const body = BusinessOrderStatusUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessOrdersService.updateStatus(user.id, businessId, orderId, body)));
}

export async function updateOrderNoteHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, orderId } = BusinessOrderItemParamsSchema.parse(request.params);
  const body = BusinessOrderNoteUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessOrdersService.updateNote(user.id, businessId, orderId, body)));
}
