import { z } from "zod";

export const CustomerAccountListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const CustomerBookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const CustomerOrderParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export type CustomerAccountListQuery = z.infer<
  typeof CustomerAccountListQuerySchema
>;
