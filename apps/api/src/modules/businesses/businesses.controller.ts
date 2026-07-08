import { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { authService } from "../auth/auth.service.js";
import { businessesService } from "./businesses.service.js";
import { BusinessOnboardingSchema } from "./businesses.validators.js";

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
