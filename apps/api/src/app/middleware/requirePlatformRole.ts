import { FastifyReply, FastifyRequest } from "fastify";
import { platformService } from "../../modules/platform/platform.service.js";
import { PlatformRole } from "../../modules/platform/platform.types.js";
import { auditService } from "../../modules/audit/audit.service.js";

async function logAccessDenied(req: FastifyRequest, reason: string) {
  await auditService.create({
    actorUserId: req.user?.id ?? null,
    entityType: "auth",
    action: "auth.access_denied",
    metadata: {
      area: "platform",
      reason,
      method: req.method,
      url: req.url,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    },
  });
}

export function requirePlatformRole(allowedRoles: PlatformRole[]) {
  return async function platformRoleGuard(
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

    const access = await platformService.getPlatformAccess(req.user.id);

    if (!access.hasAccess || !access.role) {
      await logAccessDenied(req, "no_platform_access");

      return reply.status(403).send({
        ok: false,
        error: {
          code: "PLATFORM_ACCESS_DENIED",
          message: "Platform access denied",
        },
      });
    }

    if (!allowedRoles.includes(access.role)) {
      await logAccessDenied(req, "platform_role_forbidden");

      return reply.status(403).send({
        ok: false,
        error: {
          code: "PLATFORM_ROLE_FORBIDDEN",
          message: "Your platform role is not allowed to access this resource",
        },
      });
    }

    req.platform = {
      role: access.role,
    };
  };
}

declare module "fastify" {
  interface FastifyRequest {
    platform?: {
      role: PlatformRole;
    };
  }
}
