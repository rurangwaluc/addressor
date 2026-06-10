import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import { authVerificationOtps } from "../../db/schema/auth.schema.js";
import { users } from "../../db/schema/users.schema.js";
import { sendEmailOtp } from "../../lib/email/resend.js";
import { sendSmsOtp } from "../../lib/sms/twilio.js";
import { SignUpSchemaType, LoginSchemaType } from "./auth.types.js";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_SALT_ROUNDS = 12;

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(otp: string) {
  return crypto
    .createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(otp)
    .digest("hex");
}

function createVerificationToken(userId: string) {
  return `dev-token:${userId}`;
}

function getOtpExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_TTL_MINUTES);
  return expiresAt;
}

async function createOtpRecord(params: {
  userId: string;
  channel: "email" | "phone";
  destination: string;
  otp: string;
}) {
  await db.insert(authVerificationOtps).values({
    userId: params.userId,
    channel: params.channel,
    destination: params.destination,
    otpHash: hashOtp(params.otp),
    expiresAt: getOtpExpiryDate(),
    maxAttempts: OTP_MAX_ATTEMPTS,
  });
}

async function activateUserIfFullyVerified(userId: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];

  if (!user) {
    throw new Error("Invalid token");
  }

  if (user.emailVerified && user.phoneVerified && user.status !== "active") {
    await db
      .update(users)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

async function verifyOtp(params: {
  userId: string;
  channel: "email" | "phone";
  otp: string;
}) {
  const now = new Date();

  const records = await db
    .select()
    .from(authVerificationOtps)
    .where(
      and(
        eq(authVerificationOtps.userId, params.userId),
        eq(authVerificationOtps.channel, params.channel),
        isNull(authVerificationOtps.consumedAt),
        gt(authVerificationOtps.expiresAt, now),
      ),
    )
    .orderBy(desc(authVerificationOtps.createdAt))
    .limit(1);

  const record = records[0];

  if (!record) {
    throw new Error("Invalid or expired OTP");
  }

  if (record.attempts >= record.maxAttempts) {
    throw new Error("OTP max attempts exceeded");
  }

  const incomingHash = hashOtp(params.otp);

  if (incomingHash !== record.otpHash) {
    await db
      .update(authVerificationOtps)
      .set({
        attempts: record.attempts + 1,
      })
      .where(eq(authVerificationOtps.id, record.id));

    throw new Error("Invalid OTP");
  }

  await db
    .update(authVerificationOtps)
    .set({
      consumedAt: now,
    })
    .where(eq(authVerificationOtps.id, record.id));

  if (params.channel === "email") {
    await db
      .update(users)
      .set({
        emailVerified: true,
        updatedAt: now,
      })
      .where(eq(users.id, params.userId));
  }

  if (params.channel === "phone") {
    await db
      .update(users)
      .set({
        phoneVerified: true,
        updatedAt: now,
      })
      .where(eq(users.id, params.userId));
  }

  await activateUserIfFullyVerified(params.userId);
}

export const authService = {
  async signup(payload: SignUpSchemaType) {
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.email, payload.email), eq(users.phone, payload.phone)))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Email or phone already exists");
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(payload.password, PASSWORD_SALT_ROUNDS);

    await db.insert(users).values({
      id: userId,
      email: payload.email,
      phone: payload.phone,
      fullName: payload.fullName,
      passwordHash,
      status: "pending",
      emailVerified: false,
      phoneVerified: false,
    });

    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();

    await createOtpRecord({
      userId,
      channel: "email",
      destination: payload.email,
      otp: emailOtp,
    });

    await createOtpRecord({
      userId,
      channel: "phone",
      destination: payload.phone,
      otp: phoneOtp,
    });

    await sendEmailOtp({
      to: payload.email,
      otp: emailOtp,
    });

    await sendSmsOtp({
      to: payload.phone,
      otp: phoneOtp,
    });

    return {
      userId,
      email: payload.email,
      phone: payload.phone,
      verificationToken: createVerificationToken(userId),
      verificationRequired: {
        email: true,
        phone: true,
      },
      devVerification:
        process.env.NODE_ENV === "production"
          ? undefined
          : {
              emailOtp,
              phoneOtp,
            },
    };
  },

  async login(payload: LoginSchemaType) {
    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email))
      .limit(1);

    const user = found[0];

    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error("Invalid credentials");
    }

    if (!user.emailVerified) {
      throw new Error("Email not verified");
    }

    if (!user.phoneVerified) {
      throw new Error("Phone not verified");
    }

    if (user.status !== "active") {
      await activateUserIfFullyVerified(user.id);
    }

    return {
      token: createVerificationToken(user.id),
    };
  },

  async verifyEmail(userId: string, token: string) {
    await verifyOtp({
      userId,
      channel: "email",
      otp: token,
    });

    return {
      verified: true,
      type: "email",
    };
  },

  async verifyPhone(userId: string, otp: string) {
    await verifyOtp({
      userId,
      channel: "phone",
      otp,
    });

    return {
      verified: true,
      type: "phone",
    };
  },
};