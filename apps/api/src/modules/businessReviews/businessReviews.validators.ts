import { z } from "zod";

export const CustomerReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(1000).nullable().optional(),
});

export const BusinessReviewReplySchema = z.object({
  body: z.string().trim().max(1000).nullable(),
});

export const BusinessReviewBusinessParamsSchema = z.object({
  businessId: z.string().uuid(),
});

export const BusinessReviewItemParamsSchema = z.object({
  businessId: z.string().uuid(),
  reviewId: z.string().uuid(),
});

export const CustomerOrderReviewParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export const CustomerBookingReviewParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const PublicBusinessReviewsParamsSchema = z.object({
  slug: z.string().trim().min(1).max(180),
});

export const BusinessReviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CustomerReviewInput = z.infer<typeof CustomerReviewSchema>;
export type BusinessReviewReplyInput = z.infer<
  typeof BusinessReviewReplySchema
>;
export type BusinessReviewListQuery = z.infer<
  typeof BusinessReviewListQuerySchema
>;
