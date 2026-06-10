import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { authService } from "./auth.service.js";
import { SignUpSchema, LoginSchema } from "./auth.validators.js";
import { okResponse } from "../../app/serializers/apiResponse.js";

export async function signupHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = SignUpSchema.parse(req.body);
  const result = await authService.signup(body);
  return reply.send(okResponse(result));
}

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = LoginSchema.parse(req.body);
  const result = await authService.login(body);
  return reply.send(okResponse(result));
}

export async function verifyEmailHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) {
    throw new Error("Invalid token");
  }

  const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
  const result = await authService.verifyEmail(req.user.id, token);
  return reply.send(okResponse(result));
}

export async function verifyPhoneHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) {
    throw new Error("Invalid token");
  }

  const { otp } = z.object({ otp: z.string().min(4).max(6) }).parse(req.body);
  const result = await authService.verifyPhone(req.user.id, otp);
  return reply.send(okResponse(result));
}