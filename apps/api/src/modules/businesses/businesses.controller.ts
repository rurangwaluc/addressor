import { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { authService } from "../auth/auth.service.js";
import { businessesService } from "./businesses.service.js";
import {
  BusinessOnboardingSchema,
  BusinessProfileUpdateSchema,
} from "./businesses.validators.js";

export async function completeBusinessOnboardingHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) throw new Error("Invalid token");

  const body = BusinessOnboardingSchema.parse(req.body);
  const result = await businessesService.completeOnboarding(req.user.id, body);
  const access = await authService.getAccessContext(req.user.id);

  return reply.status(201).send(
    okResponse({
      ...result,
      access,
    }),
  );
}

export async function myBusinessesHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) throw new Error("Invalid token");

  const result = await businessesService.getMyBusinesses(req.user.id);

  return reply.send(okResponse(result));
}

export async function updateBusinessProfileHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) throw new Error("Invalid token");

  const params = req.params as { businessId?: string };
  const businessId = params.businessId;

  if (!businessId) {
    throw new Error("Business id is required");
  }

  const body = BusinessProfileUpdateSchema.parse(req.body);
  const result = await businessesService.updateProfile(
    req.user.id,
    businessId,
    body,
  );
  const access = await authService.getAccessContext(req.user.id);

  return reply.send(
    okResponse({
      ...result,
      access,
    }),
  );
}
