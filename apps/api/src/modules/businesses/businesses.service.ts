import { and, count, desc, eq, isNotNull, or } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import {
  businessBookingRequests,
  businessProfileViews,
  businessReviewComments,
  businessReviews,
  businessUpdateSubscribers,
} from "../../db/schema/business-account.schema.js";
import { businessMenus } from "../../db/schema/uploaded-menu.schema.js";
import {
  businessCapabilities,
  businesses,
  businessTeamMembers,
} from "../../db/schema/businesses.schema.js";
import { getDefaultBusinessCapabilities } from "../businessCapabilities/businessCapabilities.defaults.js";
import type {
  BusinessOnboardingSchemaType,
  BusinessProfileImageUpdateSchemaType,
  BusinessProfileImageUploadSchemaType,
  BusinessProfileUpdateSchemaType,
} from "./businesses.validators.js";
import { createProfileImageUpload as createR2ProfileImageUpload } from "../../lib/storage/r2.js";
import type {
  BusinessOnboardingResponse,
  BusinessOwnerSummaryResponse,
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

export async function assertCanEditBusiness(userId: string, businessId: string) {
  const rows = await db
    .select({
      role: businessTeamMembers.role,
      status: businessTeamMembers.status,
    })
    .from(businessTeamMembers)
    .where(
      and(
        eq(businessTeamMembers.userId, userId),
        eq(businessTeamMembers.businessId, businessId),
      ),
    )
    .limit(1);

  const membership = rows[0];

  if (!membership || membership.status !== "active") {
    throw new Error("Business access denied");
  }

  if (
    membership.role !== "business_owner" &&
    membership.role !== "business_manager"
  ) {
    throw new Error("Business access denied");
  }
}

async function countBusinessRows(table: any, businessId: string) {
  const rows = await db
    .select({ value: count() })
    .from(table)
    .where(eq(table.businessId, businessId));

  return Number(rows[0]?.value ?? 0);
}

async function countBusinessRowsByStatus(
  table: any,
  businessId: string,
  status: string,
) {
  const rows = await db
    .select({ value: count() })
    .from(table)
    .where(and(eq(table.businessId, businessId), eq(table.status, status)));

  return Number(rows[0]?.value ?? 0);
}

export const businessesService = {
  async updateProfileImage(
    userId: string,
    businessId: string,
    payload: BusinessProfileImageUpdateSchemaType,
  ): Promise<BusinessOnboardingResponse> {
    await assertCanEditBusiness(userId, businessId);

    const imageUrl = cleanOptional(payload.imageUrl);
    const updated = await db
      .update(businesses)
      .set(
        payload.purpose === "cover"
          ? { coverImageUrl: imageUrl, updatedAt: new Date() }
          : { logoUrl: imageUrl, updatedAt: new Date() },
      )
      .where(eq(businesses.id, businessId))
      .returning();
    const business = updated[0];

    if (!business) {
      throw new Error("Business could not be updated");
    }

    return {
      business: mapBusiness(business),
    };
  },

  async createProfileImageUpload(
    userId: string,
    businessId: string,
    payload: BusinessProfileImageUploadSchemaType,
    r2: {
      accountId?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      bucket?: string;
      publicUrl?: string;
    },
  ) {
    await assertCanEditBusiness(userId, businessId);

    return createR2ProfileImageUpload(r2, {
      businessId,
      purpose: payload.purpose,
      contentType: payload.contentType,
      size: payload.size,
    });
  },

  async completeOnboarding(
    ownerUserId: string,
    payload: BusinessOnboardingSchemaType,
  ): Promise<BusinessOnboardingResponse> {
    const displayName = payload.displayName.trim();
    const legalName = cleanOptional(payload.legalName) ?? displayName;
    const slug = await createUniqueBusinessSlug(displayName);

    const category = payload.category.trim();
    const business = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(businesses)
        .values({
          ownerUserId,
          legalName,
          displayName,
          slug,
          category,
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
      const created = inserted[0];

      if (!created) throw new Error("Business could not be created");

      await tx.insert(businessCapabilities).values({
        businessId: created.id,
        ...getDefaultBusinessCapabilities(category),
      });
      await tx.insert(businessTeamMembers).values({
        businessId: created.id,
        userId: ownerUserId,
        role: "business_owner",
        status: "active",
        joinedAt: new Date(),
      });

      return created;
    });

    return {
      business: mapBusiness(business),
    };
  },

  async getMyBusinesses(userId: string): Promise<MyBusinessesResponse> {
    const rows = await db
      .select({
        business: businesses,
        capabilities: businessCapabilities,
        role: businessTeamMembers.role,
        teamStatus: businessTeamMembers.status,
      })
      .from(businessTeamMembers)
      .innerJoin(businesses, eq(businessTeamMembers.businessId, businesses.id))
      .leftJoin(
        businessCapabilities,
        eq(businessTeamMembers.businessId, businessCapabilities.businessId),
      )
      .where(eq(businessTeamMembers.userId, userId));

    return {
      businesses: rows.map((row) => ({
        ...mapBusiness(row.business),
        capabilities: row.capabilities
          ? {
              menu: row.capabilities.menu,
              services: row.capabilities.services,
              products: row.capabilities.products,
              bookings: row.capabilities.bookings,
              orders: row.capabilities.orders,
            }
          : {
              menu: false,
              services: false,
              products: false,
              bookings: false,
              orders: false,
            },
        role: row.role,
        teamStatus: row.teamStatus,
      })),
    };
  },

  async getFeaturedBusinesses() {
    const rows = await db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.onboardingStatus, "completed"),
          isNotNull(businesses.coverImageUrl),
          or(isNotNull(businesses.phone), isNotNull(businesses.whatsappNumber)),
        ),
      )
      .orderBy(desc(businesses.updatedAt))
      .limit(6);

    return {
      businesses: rows.map(mapBusiness),
    };
  },

  async getOwnerSummary(
    userId: string,
    businessId: string,
  ): Promise<BusinessOwnerSummaryResponse> {
    await assertCanEditBusiness(userId, businessId);

    const businessRows = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const business = businessRows[0];

    if (!business) {
      throw new Error("Business was not found");
    }

    const capabilityRows = await db
      .select()
      .from(businessCapabilities)
      .where(eq(businessCapabilities.businessId, businessId))
      .limit(1);
    const capabilities = capabilityRows[0] ?? {
      menu: false,
      services: false,
      products: false,
      bookings: false,
      orders: false,
    };

    const [
      profileViews,
      newBookings,
      reviews,
      comments,
      publishedMenus,
      subscribers,
    ] = await Promise.all([
      countBusinessRows(businessProfileViews, businessId),
      capabilities.bookings
        ? countBusinessRowsByStatus(businessBookingRequests, businessId, "new")
        : Promise.resolve(0),
      countBusinessRows(businessReviews, businessId),
      countBusinessRows(businessReviewComments, businessId),
      capabilities.menu
        ? countBusinessRowsByStatus(businessMenus, businessId, "published")
        : Promise.resolve(0),
      countBusinessRowsByStatus(businessUpdateSubscribers, businessId, "active"),
    ]);

    const attention: BusinessOwnerSummaryResponse["attention"] = [];

    if (!business.coverImageUrl) {
      attention.push({
        title: "Add a cover photo",
        text: "A clear photo helps visitors understand your place faster.",
        action: "Add photos",
        href: "/business-photos",
        priority: "high",
      });
    }

    if (!business.phone && !business.whatsappNumber) {
      attention.push({
        title: "Add contact details",
        text: "People need one clear way to call or message your business.",
        action: "Edit profile",
        href: "/business-profile",
        priority: "high",
      });
    }

    const hasPublishedMenu = publishedMenus > 0;

    if (capabilities.menu && !hasPublishedMenu) {
      attention.push({
        title: "Add your menu",
        text: "Show what people can order, book, or ask about before they contact you.",
        action: "Add menu",
        href: "/business-menu",
        priority: "medium",
      });
    }

    if (capabilities.bookings && newBookings > 0) {
      attention.push({
        title: "Check new booking requests",
        text: "Respond while customers are still ready to choose.",
        action: "View bookings",
        href: "/business-bookings",
        priority: "high",
      });
    }

    return {
      business: mapBusiness(business),
      overview: {
        profileViews,
        newBookings,
        reviews,
        comments,
        hasPublishedMenu,
        subscribers,
      },
      attention,
    };
  },

  async updateProfile(
    userId: string,
    businessId: string,
    payload: BusinessProfileUpdateSchemaType,
  ): Promise<BusinessOnboardingResponse> {
    await assertCanEditBusiness(userId, businessId);

    const displayName = payload.displayName.trim();
    const legalName = cleanOptional(payload.legalName) ?? displayName;

    const updated = await db
      .update(businesses)
      .set({
        displayName,
        legalName,
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
        logoUrl: cleanOptional(payload.logoUrl),
        coverImageUrl: cleanOptional(payload.coverImageUrl),
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId))
      .returning();

    const business = updated[0];

    if (!business) {
      throw new Error("Business could not be updated");
    }

    return {
      business: mapBusiness(business),
    };
  },
};
