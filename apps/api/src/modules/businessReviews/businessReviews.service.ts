import {
  and,
  count,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import {
  businessBookingRequests,
  businessReviews,
} from "../../db/schema/business-account.schema.js";
import { businessOrderRequests } from "../../db/schema/business-orders.schema.js";
import { businesses } from "../../db/schema/businesses.schema.js";
import { assertCanEditBusiness } from "../businesses/businesses.service.js";
import {
  PublicReviewsBusinessNotFoundError,
  ReviewAlreadyExistsError,
  ReviewNotEligibleError,
  ReviewNotFoundError,
  ReviewSourceNotFoundError,
} from "./businessReviews.errors.js";
import type {
  BusinessReviewListQuery,
  BusinessReviewReplyInput,
  CustomerReviewInput,
} from "./businessReviews.validators.js";

type ReviewRow = typeof businessReviews.$inferSelect;

function cleanOptionalText(value: string | null | undefined) {
  if (value === undefined || value === null) return null;

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function pagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

export function mapCustomerReview(row: ReviewRow) {
  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    status: row.status,
    ownerReply: row.ownerReply,
    ownerRepliedAt: row.ownerRepliedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBusinessReview(row: ReviewRow) {
  return {
    id: row.id,
    customerName: row.customerName,
    rating: row.rating,
    body: row.body,
    status: row.status,
    ownerReply: row.ownerReply,
    ownerRepliedAt: row.ownerRepliedAt,
    interaction: row.orderRequestId
      ? {
          type: "order" as const,
          id: row.orderRequestId,
        }
      : {
          type: "booking" as const,
          id: row.bookingRequestId!,
        },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapPublicReview(row: ReviewRow) {
  return {
    id: row.id,
    customerName: row.customerName ?? "Addressor customer",
    rating: row.rating,
    body: row.body,
    interactionType: row.orderRequestId
      ? ("order" as const)
      : ("booking" as const),
    ownerReply: row.ownerReply,
    ownerRepliedAt: row.ownerRepliedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function publishedSummary(businessId: string) {
  const where = and(
    eq(businessReviews.businessId, businessId),
    eq(businessReviews.status, "published"),
  );

  const [summaryRows, distributionRows] = await Promise.all([
    db
      .select({
        reviewCount: count(),
        averageRating: sql<string | null>`avg(${businessReviews.rating})`,
      })
      .from(businessReviews)
      .where(where),

    db
      .select({
        rating: businessReviews.rating,
        value: count(),
      })
      .from(businessReviews)
      .where(where)
      .groupBy(businessReviews.rating),
  ]);

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const row of distributionRows) {
    if (row.rating >= 1 && row.rating <= 5) {
      distribution[row.rating as 1 | 2 | 3 | 4 | 5] = Number(
        row.value,
      );
    }
  }

  const summary = summaryRows[0];

  return {
    reviewCount: Number(summary?.reviewCount ?? 0),
    averageRating:
      summary?.averageRating === null ||
      summary?.averageRating === undefined
        ? null
        : Number(Number(summary.averageRating).toFixed(2)),
    distribution,
  };
}

async function findOrderForCustomer(userId: string, orderId: string) {
  const rows = await db
    .select({
      id: businessOrderRequests.id,
      businessId: businessOrderRequests.businessId,
      customerUserId: businessOrderRequests.customerUserId,
      customerName: businessOrderRequests.customerName,
      status: businessOrderRequests.status,
      completedAt: businessOrderRequests.completedAt,
    })
    .from(businessOrderRequests)
    .where(
      and(
        eq(businessOrderRequests.id, orderId),
        eq(businessOrderRequests.customerUserId, userId),
      ),
    )
    .limit(1);

  const order = rows[0];

  if (!order) {
    throw new ReviewSourceNotFoundError("order");
  }

  return order;
}

async function findBookingForCustomer(
  userId: string,
  bookingId: string,
) {
  const rows = await db
    .select({
      id: businessBookingRequests.id,
      businessId: businessBookingRequests.businessId,
      customerUserId: businessBookingRequests.customerUserId,
      customerName: businessBookingRequests.customerName,
      status: businessBookingRequests.status,
      completedAt: businessBookingRequests.completedAt,
    })
    .from(businessBookingRequests)
    .where(
      and(
        eq(businessBookingRequests.id, bookingId),
        eq(businessBookingRequests.customerUserId, userId),
      ),
    )
    .limit(1);

  const booking = rows[0];

  if (!booking) {
    throw new ReviewSourceNotFoundError("booking");
  }

  return booking;
}

function assertCompleted(source: {
  status: string;
  completedAt: Date | null;
}) {
  if (source.status !== "completed" || !source.completedAt) {
    throw new ReviewNotEligibleError();
  }
}

export const businessReviewsService = {
  async createForOrder(
    userId: string,
    orderId: string,
    payload: CustomerReviewInput,
  ) {
    const order = await findOrderForCustomer(userId, orderId);
    assertCompleted(order);

    const existing = await db
      .select({ id: businessReviews.id })
      .from(businessReviews)
      .where(eq(businessReviews.orderRequestId, order.id))
      .limit(1);

    if (existing[0]) {
      throw new ReviewAlreadyExistsError();
    }

    try {
      const inserted = await db
        .insert(businessReviews)
        .values({
          businessId: order.businessId,
          customerUserId: userId,
          customerName: order.customerName,
          orderRequestId: order.id,
          bookingRequestId: null,
          rating: payload.rating,
          body: cleanOptionalText(payload.body),
          status: "published",
          updatedAt: new Date(),
        })
        .returning();

      const review = inserted[0];

      if (!review) {
        throw new Error("Review could not be created");
      }

      return {
        review: mapCustomerReview(review),
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ReviewAlreadyExistsError();
      }

      throw error;
    }
  },

  async updateForOrder(
    userId: string,
    orderId: string,
    payload: CustomerReviewInput,
  ) {
    await findOrderForCustomer(userId, orderId);

    const updated = await db
      .update(businessReviews)
      .set({
        rating: payload.rating,
        body: cleanOptionalText(payload.body),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessReviews.orderRequestId, orderId),
          eq(businessReviews.customerUserId, userId),
        ),
      )
      .returning();

    const review = updated[0];

    if (!review) {
      throw new ReviewNotFoundError();
    }

    return {
      review: mapCustomerReview(review),
    };
  },

  async createForBooking(
    userId: string,
    bookingId: string,
    payload: CustomerReviewInput,
  ) {
    const booking = await findBookingForCustomer(userId, bookingId);
    assertCompleted(booking);

    const existing = await db
      .select({ id: businessReviews.id })
      .from(businessReviews)
      .where(eq(businessReviews.bookingRequestId, booking.id))
      .limit(1);

    if (existing[0]) {
      throw new ReviewAlreadyExistsError();
    }

    try {
      const inserted = await db
        .insert(businessReviews)
        .values({
          businessId: booking.businessId,
          customerUserId: userId,
          customerName: booking.customerName,
          orderRequestId: null,
          bookingRequestId: booking.id,
          rating: payload.rating,
          body: cleanOptionalText(payload.body),
          status: "published",
          updatedAt: new Date(),
        })
        .returning();

      const review = inserted[0];

      if (!review) {
        throw new Error("Review could not be created");
      }

      return {
        review: mapCustomerReview(review),
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ReviewAlreadyExistsError();
      }

      throw error;
    }
  },

  async updateForBooking(
    userId: string,
    bookingId: string,
    payload: CustomerReviewInput,
  ) {
    await findBookingForCustomer(userId, bookingId);

    const updated = await db
      .update(businessReviews)
      .set({
        rating: payload.rating,
        body: cleanOptionalText(payload.body),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessReviews.bookingRequestId, bookingId),
          eq(businessReviews.customerUserId, userId),
        ),
      )
      .returning();

    const review = updated[0];

    if (!review) {
      throw new ReviewNotFoundError();
    }

    return {
      review: mapCustomerReview(review),
    };
  },

  async listForBusiness(
    userId: string,
    businessId: string,
    query: BusinessReviewListQuery,
  ) {
    await assertCanEditBusiness(userId, businessId);

    const offset = (query.page - 1) * query.limit;

    const [rows, totalRows, summary] = await Promise.all([
      db
        .select()
        .from(businessReviews)
        .where(eq(businessReviews.businessId, businessId))
        .orderBy(desc(businessReviews.createdAt))
        .limit(query.limit)
        .offset(offset),

      db
        .select({ value: count() })
        .from(businessReviews)
        .where(eq(businessReviews.businessId, businessId)),

      publishedSummary(businessId),
    ]);

    const total = Number(totalRows[0]?.value ?? 0);

    return {
      reviews: rows.map(mapBusinessReview),
      summary,
      pagination: pagination(query.page, query.limit, total),
    };
  },

  async getForBusiness(
    userId: string,
    businessId: string,
    reviewId: string,
  ) {
    await assertCanEditBusiness(userId, businessId);

    const rows = await db
      .select()
      .from(businessReviews)
      .where(
        and(
          eq(businessReviews.id, reviewId),
          eq(businessReviews.businessId, businessId),
        ),
      )
      .limit(1);

    const review = rows[0];

    if (!review) {
      throw new ReviewNotFoundError();
    }

    return {
      review: mapBusinessReview(review),
    };
  },

  async updateReply(
    userId: string,
    businessId: string,
    reviewId: string,
    payload: BusinessReviewReplyInput,
  ) {
    await assertCanEditBusiness(userId, businessId);

    const ownerReply = cleanOptionalText(payload.body);
    const now = new Date();

    const updated = await db
      .update(businessReviews)
      .set({
        ownerReply,
        ownerRepliedAt: ownerReply ? now : null,
        updatedAt: now,
      })
      .where(
        and(
          eq(businessReviews.id, reviewId),
          eq(businessReviews.businessId, businessId),
        ),
      )
      .returning();

    const review = updated[0];

    if (!review) {
      throw new ReviewNotFoundError();
    }

    return {
      review: mapBusinessReview(review),
    };
  },

  async listPublic(
    slug: string,
    query: BusinessReviewListQuery,
  ) {
    const businessRows = await db
      .select({
        id: businesses.id,
        displayName: businesses.displayName,
        slug: businesses.slug,
      })
      .from(businesses)
      .where(
        and(
          eq(businesses.slug, slug),
          eq(businesses.onboardingStatus, "completed"),
          eq(businesses.verificationStatus, "approved"),
        ),
      )
      .limit(1);

    const business = businessRows[0];

    if (!business) {
      throw new PublicReviewsBusinessNotFoundError();
    }

    const where = and(
      eq(businessReviews.businessId, business.id),
      eq(businessReviews.status, "published"),
    );

    const offset = (query.page - 1) * query.limit;

    const [rows, totalRows, summary] = await Promise.all([
      db
        .select()
        .from(businessReviews)
        .where(where)
        .orderBy(desc(businessReviews.createdAt))
        .limit(query.limit)
        .offset(offset),

      db
        .select({ value: count() })
        .from(businessReviews)
        .where(where),

      publishedSummary(business.id),
    ]);

    const total = Number(totalRows[0]?.value ?? 0);

    return {
      business,
      summary,
      reviews: rows.map(mapPublicReview),
      pagination: pagination(query.page, query.limit, total),
    };
  },
};
