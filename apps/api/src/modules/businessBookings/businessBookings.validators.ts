import { z } from "zod";

export const bookingStatuses = [
  "new",
  "accepted",
  "declined",
  "cancelled",
  "completed",
] as const;

export const BusinessBookingParamsSchema = z.object({
  businessId: z.string().uuid(),
});

export const BusinessBookingRequestParamsSchema = BusinessBookingParamsSchema.extend({
  bookingId: z.string().uuid(),
});

export const BusinessBookingSettingsUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    bookingLabel: z.string().trim().max(80).nullable().optional(),
    instructions: z.string().trim().max(1000).nullable().optional(),
    minimumAdvanceMinutes: z.number().int().min(0).max(525600).nullable().optional(),
    maximumAdvanceDays: z.number().int().min(1).max(730).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Choose at least one booking setting to update",
  });

export const BusinessBookingListQuerySchema = z
  .object({
    status: z.enum(bookingStatuses).optional(),
    upcoming: z.enum(["true"]).optional(),
    today: z.enum(["true"]).optional(),
    view: z.enum(["attention", "upcoming", "today", "history"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine((value) => !(value.upcoming && value.today), {
    message: "Choose either upcoming or today",
  })
  .refine(
    (value) =>
      !(value.upcoming || value.today) ||
      !value.status ||
      value.status === "accepted",
    {
      message: "Upcoming and today only include accepted bookings",
    },
  )
  .refine((value) => !value.view || (!value.status && !value.upcoming && !value.today), {
    message: "Choose a booking view or a status/date filter, not both",
  });

export const BusinessBookingStatusUpdateSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("accepted"),
    confirmedDate: z.coerce.date().optional(),
  }),
  z.object({ status: z.literal("declined") }),
  z.object({ status: z.literal("cancelled") }),
  z.object({ status: z.literal("completed") }),
]);

export const BusinessBookingNoteUpdateSchema = z.object({
  ownerNote: z.string().trim().max(1000).nullable(),
});

export type BusinessBookingSettingsUpdate = z.infer<
  typeof BusinessBookingSettingsUpdateSchema
>;
export type BusinessBookingListQuery = z.infer<
  typeof BusinessBookingListQuerySchema
>;
export type BusinessBookingStatusUpdate = z.infer<
  typeof BusinessBookingStatusUpdateSchema
>;
export type BusinessBookingNoteUpdate = z.infer<
  typeof BusinessBookingNoteUpdateSchema
>;
