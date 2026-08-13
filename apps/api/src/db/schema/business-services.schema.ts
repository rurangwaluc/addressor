import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";

export const businessServices = pgTable(
  "business_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceType: text("price_type").notNull(),
    priceAmount: integer("price_amount"),
    currency: text("currency").notNull().default("RWF"),
    durationMinutes: integer("duration_minutes"),
    imageUrl: text("image_url"),
    imageStorageKey: text("image_storage_key"),
    status: text("status").notNull().default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    priceTypeCheck: check(
      "business_services_price_type_check",
      sql`${table.priceType} in ('fixed', 'starting_from', 'on_request')`,
    ),
    statusCheck: check(
      "business_services_status_check",
      sql`${table.status} in ('active', 'inactive')`,
    ),
    pricingCheck: check(
      "business_services_pricing_check",
      sql`(
        ${table.priceType} in ('fixed', 'starting_from') and ${table.priceAmount} > 0
      ) or (
        ${table.priceType} = 'on_request' and ${table.priceAmount} is null
      )`,
    ),
    currencyCheck: check(
      "business_services_currency_check",
      sql`${table.currency} = 'RWF'`,
    ),
    durationCheck: check(
      "business_services_duration_check",
      sql`${table.durationMinutes} is null or ${table.durationMinutes} > 0`,
    ),
    sortOrderCheck: check(
      "business_services_sort_order_check",
      sql`${table.sortOrder} >= 0`,
    ),
    businessStatusOrderIndex: index("business_services_business_status_order_idx").on(
      table.businessId,
      table.status,
      table.sortOrder,
    ),
  }),
);
