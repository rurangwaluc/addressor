import { FastifyInstance } from "fastify";
import {
  signupHandler,
  loginHandler,
  verifyEmailHandler,
  verifyPhoneHandler,
} from "./auth.controller.js";
import { requireAuth } from "../../app/middleware/requireAuth.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/signup", signupHandler);
  fastify.post("/login", loginHandler);

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
}