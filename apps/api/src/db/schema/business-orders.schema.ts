import { sql } from "drizzle-orm";
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
import { businesses } from "./businesses.schema.js";
import { users } from "./users.schema.js";

export const businessOrderSettings = pgTable("business_order_settings", {
  businessId: uuid("business_id")
    .primaryKey()
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  instructions: text("instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessOrderRequests = pgTable(
  "business_order_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    customerEmail: text("customer_email"),
    fulfillmentType: text("fulfillment_type").notNull(),
    deliveryAddress: text("delivery_address"),
    customerNote: text("customer_note"),
    status: text("status").notNull().default("new"),
    ownerNote: text("owner_note"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    fulfillmentTypeCheck: check(
      "business_order_requests_fulfillment_type_check",
      sql`${table.fulfillmentType} in ('pickup', 'delivery', 'on_site')`,
    ),
    deliveryAddressCheck: check(
      "business_order_requests_delivery_address_check",
      sql`${table.fulfillmentType} <> 'delivery' or (${table.deliveryAddress} is not null and length(btrim(${table.deliveryAddress})) > 0)`,
    ),
    statusCheck: check(
      "business_order_requests_status_check",
      sql`${table.status} in ('new', 'accepted', 'in_progress', 'ready', 'declined', 'cancelled', 'completed')`,
    ),
    businessStatusUpdatedIndex: index("business_order_requests_business_status_updated_idx").on(
      table.businessId,
      table.status,
      table.updatedAt,
    ),
    customerCreatedIndex: index("business_order_requests_customer_created_idx").on(
      table.customerUserId,
      table.createdAt,
    ),
  }),
);

export const businessOrderItems = pgTable(
  "business_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => businessOrderRequests.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    quantity: integer("quantity").notNull(),
    customerNote: text("customer_note"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    quantityCheck: check(
      "business_order_items_quantity_check",
      sql`${table.quantity} between 1 and 99`,
    ),
    sortOrderCheck: check(
      "business_order_items_sort_order_check",
      sql`${table.sortOrder} >= 0`,
    ),
    orderSortOrderUnique: unique("business_order_items_order_sort_order_unique").on(
      table.orderId,
      table.sortOrder,
    ),
    orderIndex: index("business_order_items_order_idx").on(table.orderId),
  }),
);
