import type { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { businessCapabilitiesService } from "./businessCapabilities.service.js";
import {
  BusinessCapabilitiesUpdateSchema,
  BusinessCapabilityParamsSchema,
} from "./businessCapabilities.validators.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) throw new Error("Invalid token");
  return request.user;
}

export async function getBusinessCapabilitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessCapabilityParamsSchema.parse(request.params);
  return reply.send(okResponse(await businessCapabilitiesService.get(user.id, businessId)));
}

export async function updateBusinessCapabilitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = requireUser(request);
  const { businessId } = BusinessCapabilityParamsSchema.parse(request.params);
  const body = BusinessCapabilitiesUpdateSchema.parse(request.body);
  return reply.send(okResponse(await businessCapabilitiesService.update(user.id, businessId, body)));
}
