import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";
import { businesses } from "./businesses.schema.js";

export const businessMenus = pgTable(
  "business_menus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("draft"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => ({
    businessStatusIndex: index("business_menus_business_status_idx").on(
      table.businessId,
      table.status,
    ),
    onePublishedMenu: uniqueIndex("business_menus_one_published_idx")
      .on(table.businessId)
      .where(sql`${table.status} = 'published'`),
    oneDraftMenu: uniqueIndex("business_menus_one_draft_idx")
      .on(table.businessId)
      .where(sql`${table.status} = 'draft'`),
  }),
);

export const businessMenuFiles = pgTable(
  "business_menu_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => businessMenus.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull().unique(),
    publicUrl: text("public_url").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    menuOrderIndex: index("business_menu_files_menu_order_idx").on(
      table.menuId,
      table.sortOrder,
    ),
  }),
);
