import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import {
  authOauthAccounts,
  authPasswordResetTokens,
  authSessions,
  authVerificationOtps,
} from "../../db/schema/auth.schema.js";
import {
  businesses,
  businessTeamMembers,
} from "../../db/schema/businesses.schema.js";
import { roles, userRoles } from "../../db/schema/roles.schema.js";
import { users, userProfiles } from "../../db/schema/users.schema.js";
import { sendEmailOtp } from "../../lib/email/resend.js";
import { sendSmsOtp } from "../../lib/sms/twilio.js";
import { normalizeRwandaPhone } from "../../lib/utils/phone.js";
import type {
  AppRoleKey,
  AuthAccessContext,
  AuthBusinessAccessItem,
  AuthRoleItem,
  AuthUser,
  BusinessRoleKey,
  ForgotPasswordSchemaType,
  GoogleLoginSchemaType,
  LoginResponse,
  LoginSchemaType,
  PlatformRoleKey,
  RefreshSessionSchemaType,
  ResetPasswordSchemaType,
  SessionTokens,
  SignupResponse,
  SignUpSchemaType,
  VerificationResponse,
} from "./auth.types.js";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_SALT_ROUNDS = 12;

const ACCESS_TOKEN_TTL_MINUTES = 15;
const REFRESH_TOKEN_TTL_DAYS = 30;
const PASSWORD_RESET_TTL_MINUTES = 30;

const PLATFORM_ROLES: PlatformRoleKey[] = [
  "platform_owner",
  "platform_admin",
  "platform_support",
];

const BUSINESS_ROLES: BusinessRoleKey[] = [
  "business_owner",
  "business_manager",
  "business_staff",
];

const PLATFORM_ROLE_PRIORITY: Record<PlatformRoleKey, number> = {
  platform_owner: 3,
  platform_admin: 2,
  platform_support: 1,
};

const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRoleKey, string[]> = {
  platform_owner: [
    "platform.full_access",
    "platform.manage_admins",
    "platform.manage_support",
    "platform.manage_businesses",
    "platform.manage_users",
    "platform.manage_revenue",
    "platform.manage_settings",
  ],
  platform_admin: [
    "platform.manage_businesses",
    "platform.manage_users",
    "platform.manage_reports",
    "platform.manage_featured_places",
    "platform.handle_business_reviews",
  ],
  platform_support: [
    "platform.view_businesses",
    "platform.view_users",
    "platform.support_actions",
  ],
};

const BUSINESS_ROLE_PERMISSIONS: Record<BusinessRoleKey, string[]> = {
  business_owner: [
    "business.full_access",
    "business.manage_profile",
    "business.manage_team",
    "business.manage_locations",
    "business.manage_content",
    "business.manage_availability",
    "business.view_analytics",
    "business.manage_billing",
  ],
  business_manager: [
    "business.manage_profile",
    "business.manage_content",
    "business.manage_availability",
    "business.view_analytics",
  ],
  business_staff: [
    "business.view_dashboard",
    "business.view_listing_status",
  ],
};

type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

type GoogleTokenInfo = {
  sub?: string;
  email?: string;
  email_verified?: "true" | "false" | boolean;
  name?: string;
  picture?: string;
  aud?: string;
  error_description?: string;
};

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function generateSecureToken(prefix: string) {
  return `${prefix}_${crypto.randomBytes(48).toString("base64url")}`;
}

function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }

  return secret;
}

function hashValue(value: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("hex");
}

function hashOtp(otp: string) {
  return hashValue(otp);
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values));
}

function isPlatformRole(role: string): role is PlatformRoleKey {
  return PLATFORM_ROLES.includes(role as PlatformRoleKey);
}

function isBusinessRole(role: string): role is BusinessRoleKey {
  return BUSINESS_ROLES.includes(role as BusinessRoleKey);
}

function mapUser(params: {
  user: typeof users.$inferSelect;
  profile?: typeof userProfiles.$inferSelect | null;
}): AuthUser {
  return {
    id: params.user.id,
    email: params.user.email,
    phone: params.user.phone,
    fullName: params.user.fullName,
    avatarUrl: params.user.avatarUrl,
    status: params.user.status,
    emailVerified: params.user.emailVerified,
    phoneVerified: params.user.phoneVerified,
    onboardingCompleted: params.profile?.onboardingCompleted ?? false,
    defaultMode: params.profile?.defaultMode ?? "local",
  };
}

async function getUserProfile(userId: string) {
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return profiles[0] ?? null;
}

async function getAuthUserById(userId: string) {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];

  if (!user) {
    throw new Error("User not found");
  }

  const profile = await getUserProfile(user.id);

  return mapUser({
    user,
    profile,
  });
}

async function createUserProfileIfMissing(userId: string) {
  const existing = await getUserProfile(userId);

  if (existing) {
    return existing;
  }

  const inserted = await db
    .insert(userProfiles)
    .values({
      userId,
      country: "Rwanda",
      city: "Kigali",
      preferredCurrency: "RWF",
      preferredLanguage: "en",
      defaultMode: "local",
      onboardingCompleted: false,
    })
    .returning();

  return inserted[0] ?? null;
}

async function assignRoleIfMissing(userId: string, roleKey: AppRoleKey) {
  const matchingRoles = await db
    .select()
    .from(roles)
    .where(eq(roles.key, roleKey))
    .limit(1);

  const role = matchingRoles[0];

  if (!role) {
    return;
  }

  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(userRoles).values({
    userId,
    roleId: role.id,
  });
}

function getOtpExpiryDate() {
  return addMinutes(new Date(), OTP_TTL_MINUTES);
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
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];

  if (!user) {
    throw new Error("Invalid user");
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

async function createSession(
  userId: string,
  metadata: SessionMetadata = {},
): Promise<SessionTokens> {
  const now = new Date();

  const accessToken = generateSecureToken("addr_access");
  const refreshToken = generateSecureToken("addr_refresh");

  const expiresAt = addMinutes(now, ACCESS_TOKEN_TTL_MINUTES);
  const refreshExpiresAt = addDays(now, REFRESH_TOKEN_TTL_DAYS);

  await db.insert(authSessions).values({
    userId,
    accessTokenHash: hashValue(accessToken),
    refreshTokenHash: hashValue(refreshToken),
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
    expiresAt,
    refreshExpiresAt,
    lastUsedAt: now,
  });

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  };
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );

  if (!response.ok) {
    throw new Error("Invalid Google login");
  }

  const tokenInfo = (await response.json()) as GoogleTokenInfo;

  if (tokenInfo.error_description) {
    throw new Error("Invalid Google login");
  }

  const expectedClientId = process.env.GOOGLE_CLIENT_ID;

  if (expectedClientId && tokenInfo.aud !== expectedClientId) {
    throw new Error("Google login client mismatch");
  }

  if (!tokenInfo.sub || !tokenInfo.email) {
    throw new Error("Google login profile is incomplete");
  }

  return tokenInfo;
}

async function getOrCreateGoogleUser(tokenInfo: GoogleTokenInfo) {
  if (!tokenInfo.sub || !tokenInfo.email) {
    throw new Error("Google login profile is incomplete");
  }

  const normalizedEmail = tokenInfo.email.toLowerCase();
  const emailVerified =
    tokenInfo.email_verified === true || tokenInfo.email_verified === "true";

  const linkedAccounts = await db
    .select()
    .from(authOauthAccounts)
    .where(
      and(
        eq(authOauthAccounts.provider, "google"),
        eq(authOauthAccounts.providerAccountId, tokenInfo.sub),
      ),
    )
    .limit(1);

  const linkedAccount = linkedAccounts[0];

  if (linkedAccount) {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, linkedAccount.userId))
      .limit(1);

    const existingUser = existingUsers[0];

    if (!existingUser) {
      throw new Error("Google account is linked to a missing user");
    }

    return existingUser;
  }

  const matchingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const matchingUser = matchingUsers[0];

  if (matchingUser) {
    await db.insert(authOauthAccounts).values({
      userId: matchingUser.id,
      provider: "google",
      providerAccountId: tokenInfo.sub,
      email: normalizedEmail,
      emailVerified,
    });

    if (emailVerified && !matchingUser.emailVerified) {
      await db
        .update(users)
        .set({
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, matchingUser.id));

      return {
        ...matchingUser,
        emailVerified: true,
      };
    }

    return matchingUser;
  }

  const insertedUsers = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      phone: null,
      fullName: tokenInfo.name || normalizedEmail.split("@")[0] || "Addressor user",
      avatarUrl: tokenInfo.picture ?? null,
      passwordHash: null,
      status: emailVerified ? "active" : "pending",
      emailVerified,
      phoneVerified: false,
    })
    .returning();

  const createdUser = insertedUsers[0];

  if (!createdUser) {
    throw new Error("Could not create Google user");
  }

  await createUserProfileIfMissing(createdUser.id);
  await assignRoleIfMissing(createdUser.id, "customer");

  await db.insert(authOauthAccounts).values({
    userId: createdUser.id,
    provider: "google",
    providerAccountId: tokenInfo.sub,
    email: normalizedEmail,
    emailVerified,
  });

  return createdUser;
}

export const authService = {
  async getAccessContext(userId: string): Promise<AuthAccessContext> {
    const user = await getAuthUserById(userId);

    const globalRoleRows = await db
      .select({
        key: roles.key,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const businessRows = await db
      .select({
        businessId: businessTeamMembers.businessId,
        businessName: businesses.displayName,
        businessSlug: businesses.slug,
        branchId: businessTeamMembers.branchId,
        role: businessTeamMembers.role,
        status: businessTeamMembers.status,
      })
      .from(businessTeamMembers)
      .innerJoin(businesses, eq(businessTeamMembers.businessId, businesses.id))
      .where(eq(businessTeamMembers.userId, userId));

    const activeBusinesses: AuthBusinessAccessItem[] = businessRows
      .filter((row) => row.status === "active" && isBusinessRole(row.role))
      .map((row) => ({
        businessId: row.businessId,
        businessName: row.businessName,
        businessSlug: row.businessSlug,
        branchId: row.branchId,
        role: row.role as BusinessRoleKey,
        status: row.status,
      }));

    const rolesList: AuthRoleItem[] = [];

    if (user.status === "active") {
      rolesList.push({
        key: "user",
        source: "virtual",
      });
    }

    for (const row of globalRoleRows) {
      if (row.key === "customer" || isPlatformRole(row.key)) {
        rolesList.push({
          key: row.key as AppRoleKey,
          source: "global",
        });
      }
    }

    for (const business of activeBusinesses) {
      rolesList.push({
        key: business.role,
        source: "business",
        businessId: business.businessId,
      });
    }

    const platformRoles = globalRoleRows
      .map((row) => row.key)
      .filter(isPlatformRole)
      .sort((a, b) => PLATFORM_ROLE_PRIORITY[b] - PLATFORM_ROLE_PRIORITY[a]);

    const platformRole = platformRoles[0] ?? null;

    const platformPermissions = platformRole
      ? PLATFORM_ROLE_PERMISSIONS[platformRole]
      : [];

    const businessPermissions = activeBusinesses.flatMap(
      (business) => BUSINESS_ROLE_PERMISSIONS[business.role],
    );

    const permissions = dedupeStrings([
      ...platformPermissions,
      ...businessPermissions,
    ]);

    const isVerified = user.emailVerified && user.phoneVerified;
    const isBusinessOwner = activeBusinesses.some(
      (business) => business.role === "business_owner",
    );

    return {
      roles: rolesList,
      platform: {
        hasAccess: Boolean(platformRole),
        role: platformRole,
        permissions: platformPermissions,
      },
      businesses: activeBusinesses,
      activeBusiness: activeBusinesses[0] ?? null,
      permissions,
      flags: {
        isVerified,
        isOnboardingCompleted: user.onboardingCompleted,
        isPlatformUser: Boolean(platformRole),
        isBusinessUser: activeBusinesses.length > 0,
        isBusinessOwner,
      },
    };
  },

  async signup(
    payload: SignUpSchemaType,
    metadata: SessionMetadata = {},
  ): Promise<SignupResponse & Partial<LoginResponse>> {
    const normalizedPhone = normalizeRwandaPhone(payload.phone);

    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.email, payload.email), eq(users.phone, normalizedPhone)))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Email or phone already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, PASSWORD_SALT_ROUNDS);

    const insertedUsers = await db
      .insert(users)
      .values({
        email: payload.email,
        phone: normalizedPhone,
        fullName: payload.fullName,
        passwordHash,
        status: "pending",
        emailVerified: false,
        phoneVerified: false,
      })
      .returning();

    const createdUser = insertedUsers[0];

    if (!createdUser) {
      throw new Error("Could not create account");
    }

    await createUserProfileIfMissing(createdUser.id);
    await assignRoleIfMissing(createdUser.id, "customer");

    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();

    await createOtpRecord({
      userId: createdUser.id,
      channel: "email",
      destination: payload.email,
      otp: emailOtp,
    });

    await createOtpRecord({
      userId: createdUser.id,
      channel: "phone",
      destination: normalizedPhone,
      otp: phoneOtp,
    });

    await sendEmailOtp({
      to: payload.email,
      otp: emailOtp,
    });

    await sendSmsOtp({
      to: normalizedPhone,
      otp: phoneOtp,
    });

    const tokens = await createSession(createdUser.id, metadata);
    const user = await getAuthUserById(createdUser.id);
    const access = await this.getAccessContext(createdUser.id);

    return {
      user,
      access,
      token: tokens.accessToken,
      ...tokens,
      verificationToken: tokens.accessToken,
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

  async login(
    payload: LoginSchemaType,
    metadata: SessionMetadata = {},
  ): Promise<LoginResponse> {
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

    await createUserProfileIfMissing(user.id);
    await assignRoleIfMissing(user.id, "customer");

    const tokens = await createSession(user.id, metadata);
    const authUser = await getAuthUserById(user.id);
    const access = await this.getAccessContext(user.id);

    return {
      token: tokens.accessToken,
      ...tokens,
      user: authUser,
      access,
    };
  },

  async loginWithGoogle(
    payload: GoogleLoginSchemaType,
    metadata: SessionMetadata = {},
  ): Promise<LoginResponse> {
    const tokenInfo = await verifyGoogleIdToken(payload.idToken);
    const user = await getOrCreateGoogleUser(tokenInfo);

    await createUserProfileIfMissing(user.id);
    await assignRoleIfMissing(user.id, "customer");

    const tokens = await createSession(user.id, metadata);
    const authUser = await getAuthUserById(user.id);
    const access = await this.getAccessContext(user.id);

    return {
      token: tokens.accessToken,
      ...tokens,
      user: authUser,
      access,
    };
  },

  async authenticateAccessToken(token: string) {
    const now = new Date();
    const tokenHash = hashValue(token);

    const sessions = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.accessTokenHash, tokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, now),
        ),
      )
      .limit(1);

    const session = sessions[0];

    if (!session) {
      throw new Error("Invalid or expired session");
    }

    await db
      .update(authSessions)
      .set({
        lastUsedAt: now,
      })
      .where(eq(authSessions.id, session.id));

    const user = await getAuthUserById(session.userId);

    if (user.status !== "active" && !user.emailVerified) {
      throw new Error("Account is not active");
    }

    return {
      user,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        refreshExpiresAt: session.refreshExpiresAt,
      },
    };
  },

  async me(userId: string) {
    await createUserProfileIfMissing(userId);
    await assignRoleIfMissing(userId, "customer");

    return {
      user: await getAuthUserById(userId),
      access: await this.getAccessContext(userId),
    };
  },

  async refreshSession(
    payload: RefreshSessionSchemaType,
    metadata: SessionMetadata = {},
  ): Promise<LoginResponse> {
    const now = new Date();
    const refreshTokenHash = hashValue(payload.refreshToken);

    const sessions = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.refreshTokenHash, refreshTokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.refreshExpiresAt, now),
        ),
      )
      .limit(1);

    const session = sessions[0];

    if (!session) {
      throw new Error("Invalid or expired refresh token");
    }

    await db
      .update(authSessions)
      .set({
        revokedAt: now,
        lastUsedAt: now,
      })
      .where(eq(authSessions.id, session.id));

    const tokens = await createSession(session.userId, metadata);
    const user = await getAuthUserById(session.userId);
    const access = await this.getAccessContext(session.userId);

    return {
      token: tokens.accessToken,
      ...tokens,
      user,
      access,
    };
  },

  async logout(sessionId: string) {
    await db
      .update(authSessions)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(authSessions.id, sessionId));

    return {
      loggedOut: true,
    };
  },

  async verifyEmail(userId: string, otp: string): Promise<VerificationResponse> {
    await verifyOtp({
      userId,
      channel: "email",
      otp,
    });

    return {
      verified: true,
      type: "email",
      user: await getAuthUserById(userId),
      access: await this.getAccessContext(userId),
    };
  },

  async verifyPhone(userId: string, otp: string): Promise<VerificationResponse> {
    await verifyOtp({
      userId,
      channel: "phone",
      otp,
    });

    return {
      verified: true,
      type: "phone",
      user: await getAuthUserById(userId),
      access: await this.getAccessContext(userId),
    };
  },

  async resendVerificationOtp(userId: string, channel: "email" | "phone") {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = rows[0];

    if (!user) {
      throw new Error("User not found");
    }

    if (channel === "email") {
      if (!user.email) {
        throw new Error("Email is missing");
      }

      if (user.emailVerified) {
        return {
          sent: false,
          reason: "Email already verified",
        };
      }

      const emailOtp = generateOtp();

      await createOtpRecord({
        userId,
        channel: "email",
        destination: user.email,
        otp: emailOtp,
      });

      await sendEmailOtp({
        to: user.email,
        otp: emailOtp,
      });

      return {
        sent: true,
        channel: "email",
        devVerification:
          process.env.NODE_ENV === "production"
            ? undefined
            : {
                emailOtp,
              },
      };
    }

    if (!user.phone) {
      throw new Error("Phone is missing");
    }

    if (user.phoneVerified) {
      return {
        sent: false,
        reason: "Phone already verified",
      };
    }

    const phoneOtp = generateOtp();

    await createOtpRecord({
      userId,
      channel: "phone",
      destination: user.phone,
      otp: phoneOtp,
    });

    await sendSmsOtp({
      to: user.phone,
      otp: phoneOtp,
    });

    return {
      sent: true,
      channel: "phone",
      devVerification:
        process.env.NODE_ENV === "production"
          ? undefined
          : {
              phoneOtp,
            },
    };
  },

  async forgotPassword(payload: ForgotPasswordSchemaType) {
    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email))
      .limit(1);

    const user = found[0];

    if (!user) {
      return {
        sent: true,
      };
    }

    const token = generateSecureToken("addr_reset");
    const expiresAt = addMinutes(new Date(), PASSWORD_RESET_TTL_MINUTES);

    await db.insert(authPasswordResetTokens).values({
      userId: user.id,
      tokenHash: hashValue(token),
      expiresAt,
    });

    if (process.env.NODE_ENV === "production") {
      console.log("[PASSWORD_RESET_REQUESTED]", {
        userId: user.id,
        email: user.email,
      });
    } else {
      console.log(`[DEV PASSWORD RESET] email=${user.email} token=${token}`);
    }

    return {
      sent: true,
      devReset:
        process.env.NODE_ENV === "production"
          ? undefined
          : {
              token,
              expiresAt: expiresAt.toISOString(),
            },
    };
  },

  async resetPassword(payload: ResetPasswordSchemaType) {
    const now = new Date();
    const tokenHash = hashValue(payload.token);

    const resetTokens = await db
      .select()
      .from(authPasswordResetTokens)
      .where(
        and(
          eq(authPasswordResetTokens.tokenHash, tokenHash),
          isNull(authPasswordResetTokens.consumedAt),
          gt(authPasswordResetTokens.expiresAt, now),
        ),
      )
      .limit(1);

    const resetToken = resetTokens[0];

    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(payload.password, PASSWORD_SALT_ROUNDS);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: now,
      })
      .where(eq(users.id, resetToken.userId));

    await db
      .update(authPasswordResetTokens)
      .set({
        consumedAt: now,
      })
      .where(eq(authPasswordResetTokens.id, resetToken.id));

    await db
      .update(authSessions)
      .set({
        revokedAt: now,
      })
      .where(eq(authSessions.userId, resetToken.userId));

    return {
      reset: true,
    };
  },
};