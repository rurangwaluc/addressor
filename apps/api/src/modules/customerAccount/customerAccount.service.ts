import {
  and,
  count,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import {
  businessBookingRequests,
  businessReviews,
} from "../../db/schema/business-account.schema.js";
import {
  businessOrderItems,
  businessOrderRequests,
} from "../../db/schema/business-orders.schema.js";
import { businesses } from "../../db/schema/businesses.schema.js";
import { BookingNotFoundError } from "../businessBookings/businessBookings.errors.js";
import { OrderNotFoundError } from "../businessOrders/businessOrders.errors.js";
import type { CustomerAccountListQuery } from "./customerAccount.validators.js";

type OrderItemRow = typeof businessOrderItems.$inferSelect;

function pagination(
  page: number,
  limit: number,
  total: number,
) {
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

function mapOrderItem(row: OrderItemRow) {
  return {
    id: row.id,
    itemName: row.itemName,
    quantity: row.quantity,
    customerNote: row.customerNote,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

function mapCustomerReview(
  row: typeof businessReviews.$inferSelect,
) {
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

function reviewEligibility(
  status: string,
  completedAt: Date | null,
  hasReview: boolean,
) {
  if (hasReview) {
    return {
      canReview: false,
      reason: "already_reviewed" as const,
    };
  }

  if (status === "completed" && completedAt) {
    return {
      canReview: true,
      reason: "eligible" as const,
    };
  }

  return {
    canReview: false,
    reason: "not_completed" as const,
  };
}

const bookingSelection = {
  id: businessBookingRequests.id,
  businessId: businessBookingRequests.businessId,
  requestType: businessBookingRequests.requestType,
  message: businessBookingRequests.message,
  preferredDate: businessBookingRequests.preferredDate,
  confirmedDate: businessBookingRequests.confirmedDate,
  partySize: businessBookingRequests.partySize,
  status: businessBookingRequests.status,
  respondedAt: businessBookingRequests.respondedAt,
  completedAt: businessBookingRequests.completedAt,
  cancelledAt: businessBookingRequests.cancelledAt,
  createdAt: businessBookingRequests.createdAt,
  updatedAt: businessBookingRequests.updatedAt,
  business: {
    id: businesses.id,
    displayName: businesses.displayName,
    slug: businesses.slug,
    category: businesses.category,
    logoUrl: businesses.logoUrl,
    city: businesses.city,
  },
};

const orderSelection = {
  id: businessOrderRequests.id,
  businessId: businessOrderRequests.businessId,
  fulfillmentType: businessOrderRequests.fulfillmentType,
  deliveryAddress: businessOrderRequests.deliveryAddress,
  customerNote: businessOrderRequests.customerNote,
  status: businessOrderRequests.status,
  respondedAt: businessOrderRequests.respondedAt,
  startedAt: businessOrderRequests.startedAt,
  readyAt: businessOrderRequests.readyAt,
  completedAt: businessOrderRequests.completedAt,
  cancelledAt: businessOrderRequests.cancelledAt,
  createdAt: businessOrderRequests.createdAt,
  updatedAt: businessOrderRequests.updatedAt,
  business: {
    id: businesses.id,
    displayName: businesses.displayName,
    slug: businesses.slug,
    category: businesses.category,
    logoUrl: businesses.logoUrl,
    city: businesses.city,
  },
};

export const customerAccountService = {
  async listBookings(
    userId: string,
    query: CustomerAccountListQuery,
  ) {
    const where = eq(
      businessBookingRequests.customerUserId,
      userId,
    );
    const offset = (query.page - 1) * query.limit;

    const [rows, totalRows] = await Promise.all([
      db
        .select(bookingSelection)
        .from(businessBookingRequests)
        .innerJoin(
          businesses,
          eq(businessBookingRequests.businessId, businesses.id),
        )
        .where(where)
        .orderBy(desc(businessBookingRequests.createdAt))
        .limit(query.limit)
        .offset(offset),

      db
        .select({ value: count() })
        .from(businessBookingRequests)
        .where(where),
    ]);

    const total = Number(totalRows[0]?.value ?? 0);

    return {
      bookings: rows,
      pagination: pagination(query.page, query.limit, total),
    };
  },

  async getBooking(userId: string, bookingId: string) {
    const rows = await db
      .select(bookingSelection)
      .from(businessBookingRequests)
      .innerJoin(
        businesses,
        eq(businessBookingRequests.businessId, businesses.id),
      )
      .where(
        and(
          eq(businessBookingRequests.id, bookingId),
          eq(businessBookingRequests.customerUserId, userId),
        ),
      )
      .limit(1);

    const booking = rows[0];

    if (!booking) {
      throw new BookingNotFoundError();
    }

    const reviewRows = await db
      .select()
      .from(businessReviews)
      .where(eq(businessReviews.bookingRequestId, booking.id))
      .limit(1);

    const review = reviewRows[0] ?? null;

    return {
      booking: {
        ...booking,
        review: review ? mapCustomerReview(review) : null,
        reviewEligibility: reviewEligibility(
          booking.status,
          booking.completedAt,
          Boolean(review),
        ),
      },
    };
  },

  async listOrders(
    userId: string,
    query: CustomerAccountListQuery,
  ) {
    const where = eq(
      businessOrderRequests.customerUserId,
      userId,
    );
    const offset = (query.page - 1) * query.limit;

    const [rows, totalRows] = await Promise.all([
      db
        .select(orderSelection)
        .from(businessOrderRequests)
        .innerJoin(
          businesses,
          eq(businessOrderRequests.businessId, businesses.id),
        )
        .where(where)
        .orderBy(desc(businessOrderRequests.createdAt))
        .limit(query.limit)
        .offset(offset),

      db
        .select({ value: count() })
        .from(businessOrderRequests)
        .where(where),
    ]);

    const orderIds = rows.map((row) => row.id);

    const itemRows =
      orderIds.length > 0
        ? await db
            .select()
            .from(businessOrderItems)
            .where(inArray(businessOrderItems.orderId, orderIds))
            .orderBy(
              businessOrderItems.orderId,
              businessOrderItems.sortOrder,
            )
        : [];

    const itemsByOrder = new Map<string, OrderItemRow[]>();

    for (const item of itemRows) {
      const existing = itemsByOrder.get(item.orderId) ?? [];
      existing.push(item);
      itemsByOrder.set(item.orderId, existing);
    }

    const total = Number(totalRows[0]?.value ?? 0);

    return {
      orders: rows.map((order) => ({
        ...order,
        items: (itemsByOrder.get(order.id) ?? []).map(mapOrderItem),
      })),
      pagination: pagination(query.page, query.limit, total),
    };
  },

  async getOrder(userId: string, orderId: string) {
    const rows = await db
      .select(orderSelection)
      .from(businessOrderRequests)
      .innerJoin(
        businesses,
        eq(businessOrderRequests.businessId, businesses.id),
      )
      .where(
        and(
          eq(businessOrderRequests.id, orderId),
          eq(businessOrderRequests.customerUserId, userId),
        ),
      )
      .limit(1);

    const order = rows[0];

    if (!order) {
      throw new OrderNotFoundError();
    }

    const items = await db
      .select()
      .from(businessOrderItems)
      .where(eq(businessOrderItems.orderId, order.id))
      .orderBy(businessOrderItems.sortOrder);

    const reviewRows = await db
      .select()
      .from(businessReviews)
      .where(eq(businessReviews.orderRequestId, order.id))
      .limit(1);

    const review = reviewRows[0] ?? null;

    return {
      order: {
        ...order,
        items: items.map(mapOrderItem),
        review: review ? mapCustomerReview(review) : null,
        reviewEligibility: reviewEligibility(
          order.status,
          order.completedAt,
          Boolean(review),
        ),
      },
    };
  },
};
