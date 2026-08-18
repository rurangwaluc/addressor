import { z } from "zod";

export const orderStatuses = [
  "new",
  "accepted",
  "in_progress",
  "ready",
  "declined",
  "cancelled",
  "completed",
] as const;

export const BusinessOrderParamsSchema = z.object({ businessId: z.string().uuid() });
export const BusinessOrderItemParamsSchema = BusinessOrderParamsSchema.extend({
  orderId: z.string().uuid(),
});

export const BusinessOrderSettingsUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    instructions: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Choose at least one order setting to update",
  });

const orderItemSchema = z.object({
  itemName: z.string().trim().min(1).max(160),
  quantity: z.number().int().min(1).max(99),
  customerNote: z.string().trim().max(500).nullable().optional(),
});

export const BusinessOrderCreateSchema = z
  .object({
    fulfillmentType: z.enum(["pickup", "delivery", "on_site"]),
    deliveryAddress: z.string().trim().max(500).nullable().optional(),
    customerNote: z.string().trim().max(1000).nullable().optional(),
    items: z.array(orderItemSchema).min(1).max(30),
  })
  .superRefine((value, context) => {
    if (value.fulfillmentType === "delivery" && !value.deliveryAddress?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: "Enter a delivery address",
      });
    }
  });

export const BusinessOrderListQuerySchema = z.object({
  view: z.enum(["attention", "active", "history"]).default("attention"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const BusinessOrderStatusUpdateSchema = z.object({
  status: z.enum(orderStatuses),
});

export const BusinessOrderNoteUpdateSchema = z.object({
  ownerNote: z.string().trim().max(1000).nullable(),
});

export type BusinessOrderCreate = z.infer<typeof BusinessOrderCreateSchema>;
export type BusinessOrderListQuery = z.infer<typeof BusinessOrderListQuerySchema>;
export type BusinessOrderNoteUpdate = z.infer<typeof BusinessOrderNoteUpdateSchema>;
export type BusinessOrderSettingsUpdate = z.infer<typeof BusinessOrderSettingsUpdateSchema>;
export type BusinessOrderStatusUpdate = z.infer<typeof BusinessOrderStatusUpdateSchema>;
