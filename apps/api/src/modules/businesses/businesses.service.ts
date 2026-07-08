import { eq } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import {
  businesses,
  businessTeamMembers,
} from "../../db/schema/businesses.schema.js";
import type { BusinessOnboardingSchemaType } from "./businesses.validators.js";
import type {
  BusinessOnboardingResponse,
  MyBusinessesResponse,
} from "./businesses.types.js";

function cleanOptional(value?: string | null) {
  const next = value?.trim();

  return next ? next : null;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

async function createUniqueBusinessSlug(displayName: string) {
  const base = createSlug(displayName) || "business";
  let slug = base;
  let count = 2;

  while (true) {
    const existing = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (!existing[0]) {
      return slug;
    }

    slug = `${base}-${count}`;
    count += 1;
  }
}

function mapBusiness(row: typeof businesses.$inferSelect) {
  return {
    id: row.id,
    displayName: row.displayName,
    legalName: row.legalName,
    slug: row.slug,
    category: row.category,
    shortDescription: row.shortDescription,
    phone: row.phone,
    email: row.email,
    websiteUrl: row.websiteUrl,
    whatsappNumber: row.whatsappNumber,
    country: row.country,
    city: row.city,
    district: row.district,
    sector: row.sector,
    addressLine: row.addressLine,
    verificationStatus: row.verificationStatus,
    onboardingStatus: row.onboardingStatus,
    subscriptionStatus: row.subscriptionStatus,
    logoUrl: row.logoUrl,
    coverImageUrl: row.coverImageUrl,
  };
}

export const businessesService = {
  async completeOnboarding(
    ownerUserId: string,
    payload: BusinessOnboardingSchemaType,
  ): Promise<BusinessOnboardingResponse> {
    const displayName = payload.displayName.trim();
    const legalName = cleanOptional(payload.legalName) ?? displayName;
    const slug = await createUniqueBusinessSlug(displayName);

    const inserted = await db
      .insert(businesses)
      .values({
        ownerUserId,
        legalName,
        displayName,
        slug,
        category: payload.category.trim(),
        shortDescription: cleanOptional(payload.shortDescription),
        phone: payload.phone.trim(),
        email: cleanOptional(payload.email),
        websiteUrl: cleanOptional(payload.websiteUrl),
        whatsappNumber: cleanOptional(payload.whatsappNumber),
        city: payload.city.trim(),
        district: cleanOptional(payload.district),
        sector: cleanOptional(payload.sector),
        addressLine: cleanOptional(payload.addressLine),
        onboardingStatus: "completed",
        verificationStatus: "draft",
        subscriptionStatus: "free",
        logoUrl: cleanOptional(payload.logoUrl),
        coverImageUrl: cleanOptional(payload.coverImageUrl),
        updatedAt: new Date(),
      })
      .returning();

    const business = inserted[0];

    if (!business) {
      throw new Error("Business could not be created");
    }

    await db
      .insert(businessTeamMembers)
      .values({
        businessId: business.id,
        userId: ownerUserId,
        role: "business_owner",
        status: "active",
        joinedAt: new Date(),
      })
      .onConflictDoNothing();

    return {
      business: mapBusiness(business),
    };
  },

  async getMyBusinesses(userId: string): Promise<MyBusinessesResponse> {
    const rows = await db
      .select({
        business: businesses,
        role: businessTeamMembers.role,
        teamStatus: businessTeamMembers.status,
      })
      .from(businessTeamMembers)
      .innerJoin(businesses, eq(businessTeamMembers.businessId, businesses.id))
      .where(eq(businessTeamMembers.userId, userId));

    return {
      businesses: rows.map((row) => ({
        ...mapBusiness(row.business),
        role: row.role,
        teamStatus: row.teamStatus,
      })),
    };
  },
};
