import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

export const authVerificationOtps = pgTable("auth_verification_otps", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  channel: text("channel").notNull(),
  destination: text("destination").notNull(),

  otpHash: text("otp_hash").notNull(),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),

  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});