import { FastifyReply, FastifyRequest } from "fastify";
import { okResponse } from "../../app/serializers/apiResponse.js";
import { platformService } from "./platform.service.js";

export async function platformMeHandler(
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

  const result = await platformService.getMe(req.user.id);
  return reply.send(okResponse(result));
}