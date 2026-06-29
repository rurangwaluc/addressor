import {
  boolean,
  doublePrecision,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";

export const businessBranches = pgTable(
  "business_branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    slug: text("slug").notNull(),
    branchCode: text("branch_code"),

    phone: text("phone"),
    email: text("email"),
    whatsappNumber: text("whatsapp_number"),

    country: text("country").notNull().default("Rwanda"),
    city: text("city").notNull(),
    district: text("district"),
    sector: text("sector"),
    addressLine: text("address_line").notNull(),

    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    isHeadOffice: boolean("is_head_office").notNull().default(false),
    status: text("status").notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessBranchSlugUnique: unique("business_branches_business_id_slug_unique").on(
      table.businessId,
      table.slug,
    ),
  }),
);