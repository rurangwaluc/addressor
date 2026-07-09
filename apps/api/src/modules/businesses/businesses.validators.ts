import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid link")
  .optional()
  .or(z.literal(""));

export const BusinessOnboardingSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160).optional().or(z.literal("")),
  category: z.string().trim().min(2).max(80),
  shortDescription: z.string().trim().max(220).optional().or(z.literal("")),

  phone: z.string().trim().min(6).max(40),
  whatsappNumber: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  websiteUrl: optionalUrl,

  city: z.string().trim().min(2).max(80),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  sector: z.string().trim().max(80).optional().or(z.literal("")),
  addressLine: z.string().trim().max(180).optional().or(z.literal("")),

  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
});

export const BusinessProfileUpdateSchema = BusinessOnboardingSchema.extend({
  id: z.string().uuid().optional(),
});

export type BusinessOnboardingSchemaType = z.infer<
  typeof BusinessOnboardingSchema
>;

export type BusinessProfileUpdateSchemaType = z.infer<
  typeof BusinessProfileUpdateSchema
>;
