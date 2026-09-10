import { and, asc, count, desc, eq, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import { businessAccessService } from "../businessAccess/businessAccess.service.js";
import {
  businessBookingRequests,
  businessBookingSettings,
} from "../../db/schema/business-account.schema.js";
import { businessServices } from "../../db/schema/business-services.schema.js";
import {
  assertBusinessCapability,
  isBusinessCapabilityEnabled,
} from "../businessCapabilities/businessCapabilities.service.js";
import {
  BookingDateOutsideRangeError,
  BookingDateRequiredError,
  BookingNotFoundError,
  BookingOwnBusinessRequestError,
  BookingRequestsDisabledError,
  BookingServiceUnavailableError,
  BookingStatusConflictError,
} from "./businessBookings.errors.js";
import type {
  BusinessBookingCreate,
  BusinessBookingListQuery,
  BusinessBookingNoteUpdate,
  BusinessBookingSettingsUpdate,
  BusinessBookingStatusUpdate,
} from "./businessBookings.validators.js";

type BookingRow = typeof businessBookingRequests.$inferSelect;

type BookingCustomer = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
};

const allowedTransitions: Record<BookingRow["status"], readonly string[]> = {
  new: ["accepted", "declined"],
  accepted: ["completed", "cancelled"],
  declined: [],
  cancelled: [],
  completed: [],
};

function cleanOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function mapBooking(row: BookingRow) {
  return {
    id: row.id,
    businessId: row.businessId,
    customerUserId: row.customerUserId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    requestType: row.requestType,
    message: row.message,
    preferredDate: row.preferredDate,
    confirmedDate: row.confirmedDate,
    partySize: row.partySize,
    status: row.status,
    ownerNote: row.ownerNote,
    respondedAt: row.respondedAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getStatusConflictMessage(currentStatus: string, nextStatus: string) {
  if (currentStatus === "accepted" && nextStatus === "declined") {
    return "An accepted booking cannot be declined. Cancel it instead.";
  }

  if (currentStatus === "new") {
    return "A new booking can only be accepted or declined.";
  }

  if (currentStatus === "accepted") {
    return "An accepted booking can only be completed or cancelled.";
  }

  return `This booking is already ${currentStatus} and cannot be changed.`;
}

async function findBooking(businessId: string, bookingId: string) {
  const rows = await db
    .select()
    .from(businessBookingRequests)
    .where(
      and(
        eq(businessBookingRequests.id, bookingId),
        eq(businessBookingRequests.businessId, businessId),
      ),
    )
    .limit(1);

  const booking = rows[0];
  if (!booking) throw new BookingNotFoundError();
  return booking;
}

export const businessBookingsService = {
  async createCustomerBooking(
    user: BookingCustomer,
    businessId: string,
    payload: BusinessBookingCreate,
  ) {
    if (
      await businessAccessService.isActiveBusinessMember(
        user.id,
        businessId,
      )
    ) {
      throw new BookingOwnBusinessRequestError();
    }

    if (!(await isBusinessCapabilityEnabled(businessId, "bookings"))) {
      throw new BookingRequestsDisabledError();
    }

    const settingsRows = await db
      .select()
      .from(businessBookingSettings)
      .where(eq(businessBookingSettings.businessId, businessId))
      .limit(1);

    const settings = settingsRows[0];

    if (!settings?.enabled) {
      throw new BookingRequestsDisabledError();
    }

    const now = new Date();
    const preferredDate = payload.preferredDate;

    const minimumAdvanceMinutes = settings.minimumAdvanceMinutes ?? 0;
    const earliestAllowed = new Date(
      now.getTime() + minimumAdvanceMinutes * 60_000,
    );

    if (preferredDate.getTime() < earliestAllowed.getTime()) {
      throw new BookingDateOutsideRangeError(
        minimumAdvanceMinutes > 0
          ? "Choose a later date and time that meets this business's minimum booking notice."
          : "Choose a future date and time.",
      );
    }

    if (settings.maximumAdvanceDays !== null) {
      const latestAllowed = new Date(
        now.getTime() + settings.maximumAdvanceDays * 24 * 60 * 60_000,
      );

      if (preferredDate.getTime() > latestAllowed.getTime()) {
        throw new BookingDateOutsideRangeError(
          "Choose a date within this business's booking window.",
        );
      }
    }

    let requestType =
      cleanOptionalText(payload.requestType) ??
      cleanOptionalText(settings.bookingLabel) ??
      "Booking";

    if (payload.serviceId) {
      if (!(await isBusinessCapabilityEnabled(businessId, "services"))) {
        throw new BookingServiceUnavailableError();
      }

      const serviceRows = await db
        .select({
          id: businessServices.id,
          name: businessServices.name,
        })
        .from(businessServices)
        .where(
          and(
            eq(businessServices.id, payload.serviceId),
            eq(businessServices.businessId, businessId),
            eq(businessServices.status, "active"),
          ),
        )
        .limit(1);

      const service = serviceRows[0];

      if (!service) {
        throw new BookingServiceUnavailableError();
      }

      requestType = service.name;
    }

    const inserted = await db
      .insert(businessBookingRequests)
      .values({
        businessId,
        customerUserId: user.id,
        customerName: user.fullName,
        customerPhone: user.phone,
        customerEmail: user.email,
        requestType,
        message: cleanOptionalText(payload.message),
        preferredDate,
        partySize: payload.partySize ?? null,
      })
      .returning();

    const booking = inserted[0];

    if (!booking) {
      throw new Error("Booking request could not be created");
    }

    return { booking: mapBooking(booking) };
  },

  async getSettings(userId: string, businessId: string) {
    await assertBusinessCapability(userId, businessId, "bookings");
    const rows = await db
      .select()
      .from(businessBookingSettings)
      .where(eq(businessBookingSettings.businessId, businessId))
      .limit(1);
    const settings = rows[0];

    return settings ?? {
      businessId,
      enabled: false,
      bookingLabel: null,
      instructions: null,
      minimumAdvanceMinutes: null,
      maximumAdvanceDays: null,
      createdAt: null,
      updatedAt: null,
    };
  },

  async updateSettings(
    userId: string,
    businessId: string,
    payload: BusinessBookingSettingsUpdate,
  ) {
    await assertBusinessCapability(userId, businessId, "bookings");

    const existingRows = await db
      .select()
      .from(businessBookingSettings)
      .where(eq(businessBookingSettings.businessId, businessId))
      .limit(1);

    const existing = existingRows[0];

    const enabled = payload.enabled ?? existing?.enabled ?? false;

    const bookingLabel =
      payload.bookingLabel !== undefined
        ? cleanOptionalText(payload.bookingLabel) ?? null
        : existing?.bookingLabel ?? null;

    const instructions =
      payload.instructions !== undefined
        ? cleanOptionalText(payload.instructions) ?? null
        : existing?.instructions ?? null;

    const minimumAdvanceMinutes =
      payload.minimumAdvanceMinutes !== undefined
        ? payload.minimumAdvanceMinutes
        : existing?.minimumAdvanceMinutes ?? null;

    const maximumAdvanceDays =
      payload.maximumAdvanceDays !== undefined
        ? payload.maximumAdvanceDays
        : existing?.maximumAdvanceDays ?? null;

    const updatedAt = new Date();

    const updated = await db
      .insert(businessBookingSettings)
      .values({
        businessId,
        enabled,
        bookingLabel,
        instructions,
        minimumAdvanceMinutes,
        maximumAdvanceDays,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: businessBookingSettings.businessId,
        set: {
          enabled,
          bookingLabel,
          instructions,
          minimumAdvanceMinutes,
          maximumAdvanceDays,
          updatedAt,
        },
      })
      .returning();

    if (!updated[0]) {
      throw new Error("Booking settings could not be updated");
    }

    return updated[0];
  },

  async list(userId: string, businessId: string, query: BusinessBookingListQuery) {
    await assertBusinessCapability(userId, businessId, "bookings");
    const conditions: SQL[] = [eq(businessBookingRequests.businessId, businessId)];
    const effectiveDate = sql`coalesce(${businessBookingRequests.confirmedDate}, ${businessBookingRequests.preferredDate})`;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    if (query.view === "attention") {
      conditions.push(eq(businessBookingRequests.status, "new"));
    } else if (query.view === "upcoming") {
      conditions.push(
        eq(businessBookingRequests.status, "accepted"),
        gte(effectiveDate, tomorrowStart),
      );
    } else if (query.view === "today") {
      conditions.push(
        eq(businessBookingRequests.status, "accepted"),
        gte(effectiveDate, todayStart),
        lt(effectiveDate, tomorrowStart),
      );
    } else if (query.view === "history") {
      conditions.push(
        inArray(businessBookingRequests.status, ["completed", "declined", "cancelled"]),
      );
    }

    if (query.status) conditions.push(eq(businessBookingRequests.status, query.status));
    if (query.upcoming) {
      conditions.push(
        eq(businessBookingRequests.status, "accepted"),
        gte(effectiveDate, new Date()),
      );
    }
    if (query.today) {
      conditions.push(
        eq(businessBookingRequests.status, "accepted"),
        gte(effectiveDate, todayStart),
        lt(effectiveDate, tomorrowStart),
      );
    }

    const where = and(...conditions);
    const offset = (query.page - 1) * query.limit;
    const [rows, totalRows, summaryRows] = await Promise.all([
      db
        .select()
        .from(businessBookingRequests)
        .where(where)
        .orderBy(
          sql`case
            when ${businessBookingRequests.status} = 'new' then 0
            when ${businessBookingRequests.status} = 'accepted' and ${effectiveDate} >= now() then 1
            else 2
          end`,
          sql`case
            when ${businessBookingRequests.status} = 'accepted' and ${effectiveDate} >= now()
            then ${effectiveDate}
          end asc nulls last`,
          desc(businessBookingRequests.createdAt),
        )
        .limit(query.limit)
        .offset(offset),
      db.select({ value: count() }).from(businessBookingRequests).where(where),
      db
        .select({
          attention: sql<number>`count(*) filter (where ${businessBookingRequests.status} = 'new')`,
          upcoming: sql<number>`count(*) filter (where ${businessBookingRequests.status} = 'accepted' and ${effectiveDate} >= ${tomorrowStart})`,
          today: sql<number>`count(*) filter (where ${businessBookingRequests.status} = 'accepted' and ${effectiveDate} >= ${todayStart} and ${effectiveDate} < ${tomorrowStart})`,
          history: sql<number>`count(*) filter (where ${businessBookingRequests.status} in ('completed', 'declined', 'cancelled'))`,
        })
        .from(businessBookingRequests)
        .where(eq(businessBookingRequests.businessId, businessId)),
    ]);

    const total = Number(totalRows[0]?.value ?? 0);
    const totalPages = Math.ceil(total / query.limit);
    const summary = summaryRows[0];

    return {
      bookings: rows.map(mapBooking),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasPreviousPage: query.page > 1,
        hasNextPage: query.page < totalPages,
      },
      counts: {
        attention: Number(summary?.attention ?? 0),
        upcoming: Number(summary?.upcoming ?? 0),
        today: Number(summary?.today ?? 0),
        history: Number(summary?.history ?? 0),
      },
    };
  },

  async getById(userId: string, businessId: string, bookingId: string) {
    await assertBusinessCapability(userId, businessId, "bookings");
    return { booking: mapBooking(await findBooking(businessId, bookingId)) };
  },

  async updateStatus(
    userId: string,
    businessId: string,
    bookingId: string,
    payload: BusinessBookingStatusUpdate,
  ) {
    await assertBusinessCapability(userId, businessId, "bookings");
    const booking = await findBooking(businessId, bookingId);
    const allowed = allowedTransitions[booking.status] ?? [];

    if (!allowed.includes(payload.status)) {
      throw new BookingStatusConflictError(
        getStatusConflictMessage(booking.status, payload.status),
      );
    }

    const now = new Date();
    const lifecycle: Partial<typeof businessBookingRequests.$inferInsert> = {
      status: payload.status,
      updatedAt: now,
    };

    if (payload.status === "accepted") {
      const confirmedDate = payload.confirmedDate ?? booking.preferredDate;
      if (!confirmedDate) {
        throw new BookingDateRequiredError();
      }
      lifecycle.confirmedDate = confirmedDate;
      lifecycle.respondedAt = now;
      lifecycle.completedAt = null;
      lifecycle.cancelledAt = null;
    } else if (payload.status === "declined") {
      lifecycle.respondedAt = now;
      lifecycle.confirmedDate = null;
    } else if (payload.status === "completed") {
      lifecycle.completedAt = now;
    } else if (payload.status === "cancelled") {
      lifecycle.cancelledAt = now;
    }

    const updated = await db
      .update(businessBookingRequests)
      .set(lifecycle)
      .where(
        and(
          eq(businessBookingRequests.id, bookingId),
          eq(businessBookingRequests.businessId, businessId),
        ),
      )
      .returning();

    if (!updated[0]) throw new Error("Booking request could not be updated");
    return { booking: mapBooking(updated[0]) };
  },

  async updateNote(
    userId: string,
    businessId: string,
    bookingId: string,
    payload: BusinessBookingNoteUpdate,
  ) {
    await assertBusinessCapability(userId, businessId, "bookings");
    await findBooking(businessId, bookingId);
    const updated = await db
      .update(businessBookingRequests)
      .set({
        ownerNote: cleanOptionalText(payload.ownerNote),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessBookingRequests.id, bookingId),
          eq(businessBookingRequests.businessId, businessId),
        ),
      )
      .returning();

    if (!updated[0]) throw new Error("Booking note could not be updated");
    return { booking: mapBooking(updated[0]) };
  },
};
