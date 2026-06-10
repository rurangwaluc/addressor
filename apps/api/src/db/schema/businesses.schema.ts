import {
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";
import { businessBranches } from "./branches.schema.js";

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),

  legalName: text("legal_name").notNull(),
  displayName: text("display_name").notNull(),
  slug: text("slug").notNull().unique(),

  category: text("category").notNull(),

  shortDescription: text("short_description"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  whatsappNumber: text("whatsapp_number"),

  country: text("country").notNull().default("Rwanda"),
  city: text("city").notNull(),
  district: text("district"),
  sector: text("sector"),
  addressLine: text("address_line"),

  verificationStatus: text("verification_status").notNull().default("draft"),
  onboardingStatus: text("onboarding_status").notNull().default("draft"),
  subscriptionStatus: text("subscription_status").notNull().default("free"),

  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessTeamMembers = pgTable(
  "business_team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => businessBranches.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessUserRoleUnique: unique("business_team_members_unique").on(
      table.businessId,
      table.userId,
      table.role,
    ),
  }),
);