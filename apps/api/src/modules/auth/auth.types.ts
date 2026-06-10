import { SignUpSchemaType, LoginSchemaType } from "./auth.validators.js";

export type { SignUpSchemaType, LoginSchemaType };

export interface SignupResponse {
  userId: string;
  email: string;
  phone: string;
  verificationToken: string;
  verificationRequired: {
    email: boolean;
    phone: boolean;
  };
  devVerification?: {
    emailOtp: string;
    phoneOtp: string;
  };
}

export interface LoginResponse {
  token: string;
}

export interface VerificationResponse {
  verified: true;
  type: "email" | "phone";
}