import { z } from "zod";

export const servicePriceTypes = ["fixed", "starting_from", "on_request"] as const;
export const serviceStatuses = ["active", "inactive"] as const;

export const BusinessServiceParamsSchema = z.object({
  businessId: z.string().uuid(),
});

export const BusinessServiceItemParamsSchema = BusinessServiceParamsSchema.extend({
  serviceId: z.string().uuid(),
});

const optionalDescription = z.string().trim().max(1000).nullable().optional();
const optionalDuration = z.number().int().positive().max(525600).nullable().optional();

function validatePricing(
  value: { priceType?: typeof servicePriceTypes[number]; priceAmount?: number | null },
  context: z.RefinementCtx,
) {
  if (value.priceType === "on_request" && value.priceAmount != null) {
    context.addIssue({
      code: "custom",
      path: ["priceAmount"],
      message: "Do not enter a price when customers need to ask",
    });
  }

  if (
    (value.priceType === "fixed" || value.priceType === "starting_from") &&
    value.priceAmount == null
  ) {
    context.addIssue({
      code: "custom",
      path: ["priceAmount"],
      message: "Enter a price for this service",
    });
  }
}

export const BusinessServiceCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: optionalDescription,
    priceType: z.enum(servicePriceTypes),
    priceAmount: z.number().int().positive().max(2_000_000_000).nullable().optional(),
    currency: z.literal("RWF").default("RWF"),
    durationMinutes: optionalDuration,
    status: z.enum(serviceStatuses).default("active"),
  })
  .superRefine(validatePricing);

export const BusinessServiceUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: optionalDescription,
    priceType: z.enum(servicePriceTypes).optional(),
    priceAmount: z.number().int().positive().max(2_000_000_000).nullable().optional(),
    currency: z.literal("RWF").optional(),
    durationMinutes: optionalDuration,
    status: z.enum(serviceStatuses).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Choose at least one service detail to update",
  });

export const BusinessServiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(serviceStatuses).optional(),
});

export const BusinessServicePublicListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const businessServiceImageSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive(),
});

export const BusinessServiceImageUploadSchema = businessServiceImageSchema
  .refine((value) => value.size <= 8 * 1024 * 1024, {
    path: ["size"],
    message: "Service image must be 8 MB or smaller",
  });

export const BusinessServiceImageConfirmSchema = businessServiceImageSchema
  .extend({ key: z.string().trim().min(1).max(500) })
  .refine((value) => value.size <= 8 * 1024 * 1024, {
    path: ["size"],
    message: "Service image must be 8 MB or smaller",
  });

export type BusinessServiceCreate = z.infer<typeof BusinessServiceCreateSchema>;
export type BusinessServiceUpdate = z.infer<typeof BusinessServiceUpdateSchema>;
export type BusinessServiceListQuery = z.infer<typeof BusinessServiceListQuerySchema>;
export type BusinessServicePublicListQuery = z.infer<typeof BusinessServicePublicListQuerySchema>;
export type BusinessServiceImageUpload = z.infer<typeof BusinessServiceImageUploadSchema>;
export type BusinessServiceImageConfirm = z.infer<typeof BusinessServiceImageConfirmSchema>;
