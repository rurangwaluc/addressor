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
}

export interface VerificationResponse {
  verified: true;
  type: "email" | "phone";
  user: AuthUser;
}