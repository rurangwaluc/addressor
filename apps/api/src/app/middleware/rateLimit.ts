import { FastifyReply, FastifyRequest } from "fastify";
import { apiError } from "../serializers/apiError.js";

type RateLimitOptions = {
  name: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

function getClientKey(request: FastifyRequest) {
  const forwardedFor = request.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || request.ip || "unknown";
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 1000) return;

  for (const [key, record] of buckets.entries()) {
    if (record.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function createRateLimit(options: RateLimitOptions) {
  return async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
    const now = Date.now();
    const clientKey = getClientKey(request);
    const bucketKey = `${options.name}:${clientKey}`;
    const existing = buckets.get(bucketKey);

    cleanupExpiredBuckets(now);

    if (!existing || existing.resetAt <= now) {
      buckets.set(bucketKey, {
        count: 1,
        resetAt: now + options.windowMs,
      });

      return;
    }

    existing.count += 1;
    buckets.set(bucketKey, existing);

    if (existing.count <= options.maxRequests) {
      return;
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );

    reply
      .status(429)
      .header("Retry-After", String(retryAfterSeconds))
      .send(
        apiError(
          "RATE_LIMITED",
          "Too many requests. Try again later.",
          {
            limit: options.maxRequests,
            windowSeconds: Math.ceil(options.windowMs / 1000),
            retryAfterSeconds,
          },
        ),
      );
  };
}

export const authRateLimits = {
  login: createRateLimit({
    name: "auth:login",
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  }),

  google: createRateLimit({
    name: "auth:google",
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  }),

  signup: createRateLimit({
    name: "auth:signup",
    maxRequests: 5,
    windowMs: 30 * 60 * 1000,
  }),

  forgotPassword: createRateLimit({
    name: "auth:forgot-password",
    maxRequests: 3,
    windowMs: 30 * 60 * 1000,
  }),

  resetPassword: createRateLimit({
    name: "auth:reset-password",
    maxRequests: 5,
    windowMs: 30 * 60 * 1000,
  }),

  resendVerification: createRateLimit({
    name: "auth:resend-verification",
    maxRequests: 3,
    windowMs: 10 * 60 * 1000,
  }),

  refresh: createRateLimit({
    name: "auth:refresh",
    maxRequests: 60,
    windowMs: 15 * 60 * 1000,
  }),
};
