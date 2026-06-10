import { FastifyReply, FastifyRequest } from "fastify";
import { platformService } from "../../modules/platform/platform.service.js";
import { PlatformRole } from "../../modules/platform/platform.types.js";

export function requirePlatformRole(allowedRoles: PlatformRole[]) {
  return async function platformRoleGuard(
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

    const access = await platformService.getPlatformAccess(req.user.id);

    if (!access.hasAccess || !access.role) {
      return reply.status(403).send({
        ok: false,
        error: {
          code: "PLATFORM_ACCESS_DENIED",
          message: "Platform access denied",
        },
      });
    }

    if (!allowedRoles.includes(access.role)) {
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