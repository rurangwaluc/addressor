import { FastifyReply, FastifyRequest } from "fastify";
import { businessAccessService } from "../../modules/businessAccess/businessAccess.service.js";
import { BusinessAccessItem } from "../../modules/businessAccess/businessAccess.types.js";
import { auditService } from "../../modules/audit/audit.service.js";

declare module "fastify" {
  interface FastifyRequest {
    businessAccess?: BusinessAccessItem[];
  }
}

async function logAccessDenied(req: FastifyRequest, reason: string) {
  await auditService.create({
    actorUserId: req.user?.id ?? null,
    entityType: "auth",
    action: "auth.access_denied",
    metadata: {
      area: "business",
      reason,
      method: req.method,
      url: req.url,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    },
  });
}

export async function requireBusinessAccess(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user?.id) {
    await logAccessDenied(req, "missing_user");

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
    await logAccessDenied(req, "no_business_access");

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
