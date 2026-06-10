import Fastify from "fastify";
import cors from "@fastify/cors";
import envPlugin from "./app/plugins/env.plugin.js";
import { dbPlugin } from "./app/plugins/db.plugin.js";
import appRoutes from "./app/routes/index.js";
import { apiError } from "./app/serializers/apiError.js";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

function isZodError(error: unknown): error is { issues: unknown[] } {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.setErrorHandler((error, request, reply) => {
    if (isZodError(error)) {
      return reply.status(400).send(
        apiError("VALIDATION_ERROR", "Request validation failed", error.issues),
      );
    }

    const message = getErrorMessage(error);

    if (
      message === "Missing Authorization" ||
      message === "Invalid Authorization format" ||
      message === "Missing token" ||
      message === "Invalid token"
    ) {
      return reply.status(401).send(apiError("UNAUTHORIZED", message));
    }

    if (message === "Invalid credentials") {
      return reply
        .status(401)
        .send(apiError("INVALID_CREDENTIALS", message));
    }

    if (message === "Email not verified") {
      return reply.status(403).send(apiError("EMAIL_NOT_VERIFIED", message));
    }

    if (message === "Phone not verified") {
      return reply.status(403).send(apiError("PHONE_NOT_VERIFIED", message));
    }

    if (message === "Email or phone already exists") {
      return reply
        .status(409)
        .send(apiError("ACCOUNT_ALREADY_EXISTS", message));
    }

    if (message === "Invalid or expired OTP" || message === "Invalid OTP") {
      return reply.status(400).send(apiError("INVALID_OTP", message));
    }

    if (message === "OTP max attempts exceeded") {
      return reply
        .status(429)
        .send(apiError("OTP_MAX_ATTEMPTS_EXCEEDED", message));
    }

    if (message === "Email OTP delivery failed") {
      return reply
        .status(502)
        .send(apiError("EMAIL_DELIVERY_FAILED", message));
    }

    if (message === "Phone OTP delivery failed") {
      return reply
        .status(502)
        .send(apiError("PHONE_DELIVERY_FAILED", message));
    }

    if (message === "Platform access denied") {
      return reply
        .status(403)
        .send(apiError("PLATFORM_ACCESS_DENIED", message));
    }

    if (message === "Business access denied") {
      return reply
        .status(403)
        .send(apiError("BUSINESS_ACCESS_DENIED", message));
    }

    request.log.error(error);

    return reply
      .status(500)
      .send(apiError("INTERNAL_SERVER_ERROR", "Something went wrong"));
  });

  await app.register(envPlugin);

  await app.register(cors, {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8081",
      "http://127.0.0.1:8081",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await app.register(dbPlugin);
  await app.register(appRoutes);

  app.get("/health", async () => ({
    ok: true,
    service: "addressor-api",
  }));

  return app;
}