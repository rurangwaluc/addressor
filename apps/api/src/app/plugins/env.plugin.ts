import "dotenv/config";
import fp from "fastify-plugin";
import { z } from "zod";

const optionalEnvString = (schema: z.ZodString = z.string()) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),

  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),

  GOOGLE_CLIENT_ID: z.string().optional(),

  REDIS_URL: z.string().optional(),

  R2_ACCOUNT_ID: optionalEnvString(z.string().min(1)),
  R2_ACCESS_KEY_ID: optionalEnvString(z.string().min(1)),
  R2_SECRET_ACCESS_KEY: optionalEnvString(z.string().min(1)),
  R2_BUCKET: optionalEnvString(z.string().min(1)),
  R2_PUBLIC_URL: optionalEnvString(z.string().url()),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Addressor <onboarding@resend.dev>"),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
});

declare module "fastify" {
  interface FastifyInstance {
    env: z.infer<typeof envSchema>;
  }
}

export default fp(async function envPlugin(fastify) {
  const parsed = envSchema.parse(process.env);
  fastify.decorate("env", parsed);
});
