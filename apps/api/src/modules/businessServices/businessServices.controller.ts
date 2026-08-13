import type { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { businessServicesService } from "./businessServices.service.js";
import {
  BusinessServiceCreateSchema,
  BusinessServiceImageConfirmSchema,
  BusinessServiceImageUploadSchema,
  BusinessServiceItemParamsSchema,
  BusinessServiceListQuerySchema,
  BusinessServiceParamsSchema,
  BusinessServicePublicListQuerySchema,
  BusinessServiceUpdateSchema,
} from "./businessServices.validators.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) throw new Error("Invalid token");
  return request.user;
}

function getR2(request: FastifyRequest) {
  return {
    accountId: request.server.env.R2_ACCOUNT_ID,
    accessKeyId: request.server.env.R2_ACCESS_KEY_ID,
    secretAccessKey: request.server.env.R2_SECRET_ACCESS_KEY,
    bucket: request.server.env.R2_BUCKET,
    publicUrl: request.server.env.R2_PUBLIC_URL,
  };
}

export async function listBusinessServicesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessServiceParamsSchema.parse(request.params);
  const query = BusinessServiceListQuerySchema.parse(request.query);
  return reply.send(okResponse(await businessServicesService.listOwner(user.id, businessId, query)));
}

export async function listPublicBusinessServicesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { businessId } = BusinessServiceParamsSchema.parse(request.params);
  const query = BusinessServicePublicListQuerySchema.parse(request.query);
  return reply.send(okResponse(await businessServicesService.listPublic(businessId, query)));
}

export async function createBusinessServiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessServiceParamsSchema.parse(request.params);
  const body = BusinessServiceCreateSchema.parse(request.body);
  const result = await businessServicesService.create(user.id, businessId, body);
  return reply.status(201).send(okResponse(result));
}

export async function getBusinessServiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, serviceId } = BusinessServiceItemParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessServicesService.getById(user.id, businessId, serviceId)));
}

export async function updateBusinessServiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, serviceId } = BusinessServiceItemParamsSchema.parse(request.params);
  const body = BusinessServiceUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessServicesService.update(user.id, businessId, serviceId, body)));
}

export async function deleteBusinessServiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, serviceId } = BusinessServiceItemParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessServicesService.remove(user.id, businessId, serviceId, getR2(request))));
}

export async function createServiceImageUploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, serviceId } = BusinessServiceItemParamsSchema.parse(request.params);
  const body = BusinessServiceImageUploadSchema.parse(request.body);
  return reply.send(okResponse(await businessServicesService.createImageUpload(user.id, businessId, serviceId, body, getR2(request))));
}

export async function confirmServiceImageHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, serviceId } = BusinessServiceItemParamsSchema.parse(request.params);
  const body = BusinessServiceImageConfirmSchema.parse(request.body);
  return reply.send(okResponse(await businessServicesService.confirmImage(user.id, businessId, serviceId, body, getR2(request))));
}

export async function deleteServiceImageHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId, serviceId } = BusinessServiceItemParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessServicesService.removeImage(user.id, businessId, serviceId, getR2(request))));
}
