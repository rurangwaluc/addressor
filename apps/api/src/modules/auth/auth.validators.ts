import { z } from "zod";

const rwandaPhoneRegex = /^(?:\+?250|0)?7[2389]\d{7}$/;

export const SignUpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .regex(rwandaPhoneRegex, "Use a valid Rwanda phone number"),
  fullName: z.string().trim().min(2).max(120),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export const VerifyEmailSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Email code must be 6 digits"),
});

export const VerifyPhoneSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Phone code must be 6 digits"),
});

export const ResendVerificationSchema = z.object({
  channel: z.enum(["email", "phone"]),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().trim().min(32),
  password: SignUpSchema.shape.password,
});

export const RefreshSessionSchema = z.object({
  refreshToken: z.string().trim().min(32),
});

export const GoogleLoginSchema = z.object({
  idToken: z.string().trim().min(20),
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type VerifyEmailSchemaType = z.infer<typeof VerifyEmailSchema>;
export type VerifyPhoneSchemaType = z.infer<typeof VerifyPhoneSchema>;
export type ResendVerificationSchemaType = z.infer<typeof ResendVerificationSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
export type RefreshSessionSchemaType = z.infer<typeof RefreshSessionSchema>;
export type GoogleLoginSchemaType = z.infer<typeof GoogleLoginSchema>;