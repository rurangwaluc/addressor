import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "../../modules/auth/auth.service.js";
import type {
  AppRoleKey,
  AuthAccessContext,
  BusinessRoleKey,
  PlatformRoleKey,
} from "../../modules/auth/auth.types.js";

declare module "fastify" {
  interface FastifyRequest {
    accessContext?: AuthAccessContext;
  }
}

function sendForbidden(reply: FastifyReply, code: string, message: string) {
  return reply.status(403).send({
    ok: false,
    error: {
      code,
      message,
    },
  });
}

async function resolveAccessContext(req: FastifyRequest) {
  if (!req.user?.id) {
    return null;
  }

  if (!req.accessContext) {
    req.accessContext = await authService.getAccessContext(req.user.id);
  }

  return req.accessContext;
}

export function requireVerifiedUser() {
  return async function verifiedUserGuard(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const access = await resolveAccessContext(req);

    if (!access) {
      return reply.status(401).send({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!access.flags.isVerified) {
      return sendForbidden(
        reply,
        "USER_NOT_VERIFIED",
        "Email and phone verification are required",
      );
    }
  };
}

export function requireOnboardingCompleted() {
  return async function onboardingGuard(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const access = await resolveAccessContext(req);

    if (!access) {
      return reply.status(401).send({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!access.flags.isOnboardingCompleted) {
      return sendForbidden(
        reply,
        "ONBOARDING_REQUIRED",
        "Complete onboarding before accessing this resource",
      );
    }
  };
}

export function requireAnyRole(allowedRoles: AppRoleKey[]) {
  return async function roleGuard(req: FastifyRequest, reply: FastifyReply) {
    const access = await resolveAccessContext(req);

    if (!access) {
      return reply.status(401).send({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userRoleKeys = new Set(access.roles.map((role) => role.key));
    const allowed = allowedRoles.some((role) => userRoleKeys.has(role));

    if (!allowed) {
      return sendForbidden(
        reply,
        "ROLE_FORBIDDEN",
        "Your role is not allowed to access this resource",
      );
    }
  };
}

export function requirePlatformRole(allowedRoles: PlatformRoleKey[]) {
  return async function platformRoleGuard(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const access = await resolveAccessContext(req);

    if (!access) {
      return reply.status(401).send({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!access.platform.role || !allowedRoles.includes(access.platform.role)) {
      return sendForbidden(
        reply,
        "PLATFORM_ROLE_FORBIDDEN",
        "Your platform role is not allowed to access this resource",
      );
    }
  };
}

export function requireBusinessRole(allowedRoles: BusinessRoleKey[]) {
  return async function businessRoleGuard(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const access = await resolveAccessContext(req);

    if (!access) {
      return reply.status(401).send({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const hasBusinessRole = access.businesses.some((business) =>
      allowedRoles.includes(business.role),
    );

    if (!hasBusinessRole) {
      return sendForbidden(
        reply,
        "BUSINESS_ROLE_FORBIDDEN",
        "Your business role is not allowed to access this resource",
      );
    }
  };
}