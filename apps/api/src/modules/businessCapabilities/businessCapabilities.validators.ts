import { z } from "zod";

export const BusinessCapabilityParamsSchema = z.object({
  businessId: z.string().uuid(),
});

export const BusinessCapabilitiesUpdateSchema = z
  .object({
    menu: z.boolean().optional(),
    services: z.boolean().optional(),
    products: z.boolean().optional(),
    bookings: z.boolean().optional(),
    orders: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Choose at least one business feature to update",
  });

export type BusinessCapabilitiesUpdate = z.infer<typeof BusinessCapabilitiesUpdateSchema>;
