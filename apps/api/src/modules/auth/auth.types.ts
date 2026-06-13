import type {
  ForgotPasswordSchemaType,
  GoogleLoginSchemaType,
  LoginSchemaType,
  RefreshSessionSchemaType,
  ResendVerificationSchemaType,
  ResetPasswordSchemaType,
  SignUpSchemaType,
  VerifyEmailSchemaType,
  VerifyPhoneSchemaType,
} from "./auth.validators.js";

export type {
  ForgotPasswordSchemaType,
  GoogleLoginSchemaType,
  LoginSchemaType,
  RefreshSessionSchemaType,
  ResendVerificationSchemaType,
  ResetPasswordSchemaType,
  SignUpSchemaType,
  VerifyEmailSchemaType,
  VerifyPhoneSchemaType,
};

export type PlatformRoleKey =
  | "platform_owner"
  | "platform_admin"
  | "platform_support";

export type BusinessRoleKey =
  | "business_owner"
  | "business_manager"
  | "business_staff";

export type AppRoleKey =
  | "user"
  | "customer"
  | PlatformRoleKey
  | BusinessRoleKey;

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingCompleted: boolean;
  defaultMode: string;
};

export type AuthRoleItem = {
  key: AppRoleKey;
  source: "virtual" | "global" | "business";
  businessId?: string;
};

export type AuthBusinessAccessItem = {
  businessId: string;
  businessName: string;
  businessSlug: string;
  branchId: string | null;
  role: BusinessRoleKey;
  status: string;
};

export type AuthPlatformAccess = {
  hasAccess: boolean;
  role: PlatformRoleKey | null;
  permissions: string[];
};

export type AuthAccessContext = {
  roles: AuthRoleItem[];
  platform: AuthPlatformAccess;
  businesses: AuthBusinessAccessItem[];
  activeBusiness: AuthBusinessAccessItem | null;
  permissions: string[];
  flags: {
    isVerified: boolean;
    isOnboardingCompleted: boolean;
    isPlatformUser: boolean;
    isBusinessUser: boolean;
    isBusinessOwner: boolean;
  };
};

export type AuthMeResponse = {
  user: AuthUser;
  access: AuthAccessContext;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
};

export interface SignupResponse {
  user: AuthUser;
  verificationToken: string;
  verificationRequired: {
    email: boolean;
    phone: boolean;
  };
  devVerification?: {
    emailOtp: string;
    phoneOtp?: string;
  };
}

export interface LoginResponse extends SessionTokens {
  token: string;
  user: AuthUser;
  access: AuthAccessContext;
}

export interface VerificationResponse {
  verified: true;
  type: "email" | "phone";
  user: AuthUser;
  access: AuthAccessContext;
}