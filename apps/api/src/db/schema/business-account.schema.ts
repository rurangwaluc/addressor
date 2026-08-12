import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { businesses } from "./businesses.schema.js";
import { users } from "./users.schema.js";

export const businessProfileViews = pgTable("business_profile_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  viewerUserId: uuid("viewer_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  visitorKey: text("visitor_key"),
  source: text("source"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessReviews = pgTable("business_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  customerUserId: uuid("customer_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  customerName: text("customer_name"),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body"),
  status: text("status").notNull().default("pending"),
  ownerReply: text("owner_reply"),
  ownerRepliedAt: timestamp("owner_replied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessReviewComments = pgTable("business_review_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => businessReviews.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  authorName: text("author_name"),
  body: text("body").notNull(),
  status: text("status").notNull().default("visible"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessBookingSettings = pgTable("business_booking_settings", {
  businessId: uuid("business_id")
    .primaryKey()
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  bookingLabel: text("booking_label"),
  instructions: text("instructions"),
  minimumAdvanceMinutes: integer("minimum_advance_minutes"),
  maximumAdvanceDays: integer("maximum_advance_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  minimumAdvanceCheck: check(
    "business_booking_settings_minimum_advance_check",
    sql`${table.minimumAdvanceMinutes} is null or ${table.minimumAdvanceMinutes} between 0 and 525600`,
  ),
  maximumAdvanceCheck: check(
    "business_booking_settings_maximum_advance_check",
    sql`${table.maximumAdvanceDays} is null or ${table.maximumAdvanceDays} between 1 and 730`,
  ),
}));

export const businessBookingRequests = pgTable(
  "business_booking_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerUserId: uuid("customer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    customerEmail: text("customer_email"),
    requestType: text("request_type").notNull().default("booking"),
    message: text("message"),
    preferredDate: timestamp("preferred_date", { withTimezone: true }),
    confirmedDate: timestamp("confirmed_date", { withTimezone: true }),
    partySize: integer("party_size"),
    status: text("status").notNull().default("new"),
    ownerNote: text("owner_note"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessBookingStatusCheck: check(
      "business_booking_requests_status_check",
      sql`${table.status} in ('new', 'accepted', 'declined', 'cancelled', 'completed')`,
    ),
    businessBookingStatusIndex: index("business_booking_requests_business_status_idx").on(
      table.businessId,
      table.status,
    ),
    businessBookingPreferredDateIndex: index("business_booking_requests_business_preferred_date_idx").on(
      table.businessId,
      table.preferredDate,
    ),
    businessBookingConfirmedDateIndex: index("business_booking_requests_business_confirmed_date_idx").on(
      table.businessId,
      table.confirmedDate,
    ),
  }),
);

export const businessMenuCategories = pgTable("business_menu_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessMenuItems = pgTable("business_menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => businessMenuCategories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  priceText: text("price_text"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("available"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessUpdateSubscribers = pgTable(
  "business_update_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    channel: text("channel").notNull().default("email"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessSubscriberEmailUnique: unique(
      "business_update_subscribers_business_email_unique",
    ).on(table.businessId, table.email),
    businessSubscriberPhoneUnique: unique(
      "business_update_subscribers_business_phone_unique",
    ).on(table.businessId, table.phone),
  }),
);
