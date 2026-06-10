import { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { businessAccessService } from "./businessAccess.service.js";

export async function businessMeHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user?.id) {
    return reply.status(401).send({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  }

  const result = await businessAccessService.getMe(req.user.id);
  return reply.send(okResponse(result));
}