import { FastifyInstance } from "fastify";
import {
  forgotPasswordHandler,
  googleLoginHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshSessionHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  signupHandler,
  verifyEmailHandler,
  verifyPhoneHandler,
} from "./auth.controller.js";
import { requireAuth } from "../../app/middleware/requireAuth.js";
import { authRateLimits } from "../../app/middleware/rateLimit.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/signup",
    { preHandler: authRateLimits.signup },
    signupHandler,
  );

  fastify.post(
    "/login",
    { preHandler: authRateLimits.login },
    loginHandler,
  );

  fastify.post(
    "/google",
    { preHandler: authRateLimits.google },
    googleLoginHandler,
  );

  fastify.post(
    "/refresh",
    { preHandler: authRateLimits.refresh },
    refreshSessionHandler,
  );

  fastify.post(
    "/forgot-password",
    { preHandler: authRateLimits.forgotPassword },
    forgotPasswordHandler,
  );

  fastify.post(
    "/reset-password",
    { preHandler: authRateLimits.resetPassword },
    resetPasswordHandler,
  );

  fastify.get("/me", { preHandler: requireAuth }, meHandler);
  fastify.post("/logout", { preHandler: requireAuth }, logoutHandler);

  fastify.post(
    "/verify-email",
    { preHandler: requireAuth },
    verifyEmailHandler,
  );

  fastify.post(
    "/verify-phone",
    { preHandler: requireAuth },
    verifyPhoneHandler,
  );

  fastify.post(
    "/resend-verification",
    { preHandler: [requireAuth, authRateLimits.resendVerification] },
    resendVerificationHandler,
  );
}
