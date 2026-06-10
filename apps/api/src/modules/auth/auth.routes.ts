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

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/signup", signupHandler);
  fastify.post("/login", loginHandler);
  fastify.post("/google", googleLoginHandler);
  fastify.post("/refresh", refreshSessionHandler);
  fastify.post("/forgot-password", forgotPasswordHandler);
  fastify.post("/reset-password", resetPasswordHandler);

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
    { preHandler: requireAuth },
    resendVerificationHandler,
  );
}