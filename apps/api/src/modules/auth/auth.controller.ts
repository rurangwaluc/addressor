import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service.js";
import {
  ForgotPasswordSchema,
  GoogleLoginSchema,
  LoginSchema,
  RefreshSessionSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
  SignUpSchema,
  VerifyEmailSchema,
  VerifyPhoneSchema,
} from "./auth.validators.js";
import { okResponse } from "../../app/serializers/apiResponse.js";

function getSessionMetadata(req: FastifyRequest) {
  const userAgentHeader = req.headers["user-agent"];

  return {
    userAgent: Array.isArray(userAgentHeader)
      ? userAgentHeader.join(" ")
      : userAgentHeader,
    ipAddress: req.ip,
  };
}

export async function signupHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = SignUpSchema.parse(req.body);
  const result = await authService.signup(body, getSessionMetadata(req));
  return reply.status(201).send(okResponse(result));
}

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = LoginSchema.parse(req.body);
  const result = await authService.login(body, getSessionMetadata(req));
  return reply.send(okResponse(result));
}

export async function googleLoginHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = GoogleLoginSchema.parse(req.body);
  const result = await authService.loginWithGoogle(body, getSessionMetadata(req));
  return reply.send(okResponse(result));
}

export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) throw new Error("Invalid token");

  const result = await authService.me(req.user.id);
  return reply.send(okResponse(result));
}

export async function refreshSessionHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = RefreshSessionSchema.parse(req.body);
  const result = await authService.refreshSession(body, getSessionMetadata(req));
  return reply.send(okResponse(result));
}

export async function logoutHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!req.authSession) throw new Error("Invalid token");

  const result = await authService.logout(req.authSession.id);
  return reply.send(okResponse(result));
}

export async function verifyEmailHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) throw new Error("Invalid token");

  const { otp } = VerifyEmailSchema.parse(req.body);
  const result = await authService.verifyEmail(req.user.id, otp);
  return reply.send(okResponse(result));
}

export async function verifyPhoneHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) throw new Error("Invalid token");

  const { otp } = VerifyPhoneSchema.parse(req.body);
  const result = await authService.verifyPhone(req.user.id, otp);
  return reply.send(okResponse(result));
}

export async function resendVerificationHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) throw new Error("Invalid token");

  const { channel } = ResendVerificationSchema.parse(req.body);
  const result = await authService.resendVerificationOtp(req.user.id, channel);
  return reply.send(okResponse(result));
}

export async function forgotPasswordHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = ForgotPasswordSchema.parse(req.body);
  const result = await authService.forgotPassword(body);
  return reply.send(okResponse(result));
}

export async function resetPasswordHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = ResetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(body);
  return reply.send(okResponse(result));
}