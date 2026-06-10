import { FastifyReply, FastifyRequest } from "fastify";
import { businessAccessService } from "../../modules/businessAccess/businessAccess.service.js";
import { BusinessAccessItem } from "../../modules/businessAccess/businessAccess.types.js";

declare module "fastify" {
  interface FastifyRequest {
    businessAccess?: BusinessAccessItem[];
  }
}

export async function requireBusinessAccess(
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

  const access = await businessAccessService.getBusinessAccess(req.user.id);

  if (access.length === 0) {
    return reply.status(403).send({
      ok: false,
      error: {
        code: "BUSINESS_ACCESS_DENIED",
        message: "Business access denied",
      },
    });
  }

  req.businessAccess = access;
}