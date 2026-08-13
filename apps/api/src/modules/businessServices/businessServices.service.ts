import { and, asc, count, eq, max, type SQL } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import { businessServices } from "../../db/schema/business-services.schema.js";
import {
  confirmServiceImageUpload,
  createServiceImageUpload,
  deleteR2Object,
  type R2Config,
} from "../../lib/storage/r2.js";
import {
  assertBusinessCapability,
  isBusinessCapabilityEnabled,
} from "../businessCapabilities/businessCapabilities.service.js";
import { ServiceImageInvalidError, ServiceNotFoundError } from "./businessServices.errors.js";
import {
  BusinessServiceCreateSchema,
  type BusinessServiceCreate,
  type BusinessServiceImageConfirm,
  type BusinessServiceImageUpload,
  type BusinessServiceListQuery,
  type BusinessServicePublicListQuery,
  type BusinessServiceUpdate,
} from "./businessServices.validators.js";

type ServiceRow = typeof businessServices.$inferSelect;

function cleanOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function mapOwnerService(row: ServiceRow) {
  return {
    id: row.id,
    businessId: row.businessId,
    name: row.name,
    description: row.description,
    priceType: row.priceType,
    priceAmount: row.priceAmount,
    currency: row.currency,
    durationMinutes: row.durationMinutes,
    imageUrl: row.imageUrl,
    status: row.status,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapPublicService(row: ServiceRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceType: row.priceType,
    priceAmount: row.priceAmount,
    currency: row.currency,
    durationMinutes: row.durationMinutes,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
  };
}

function makePagination(page: number, limit: number, total: number) {
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

async function findService(businessId: string, serviceId: string) {
  const rows = await db
    .select()
    .from(businessServices)
    .where(
      and(
        eq(businessServices.businessId, businessId),
        eq(businessServices.id, serviceId),
      ),
    )
    .limit(1);
  const service = rows[0];

  if (!service) throw new ServiceNotFoundError();
  return service;
}

async function deleteImageWithoutBlocking(config: R2Config, key: string | null) {
  if (!key) return;
  try {
    await deleteR2Object(config, key);
  } catch {
    // The database remains authoritative; failed object cleanup can be retried later.
  }
}

export const businessServicesService = {
  async listOwner(userId: string, businessId: string, query: BusinessServiceListQuery) {
    await assertBusinessCapability(userId, businessId, "services");
    const conditions: SQL[] = [eq(businessServices.businessId, businessId)];
    if (query.status) conditions.push(eq(businessServices.status, query.status));
    const where = and(...conditions);
    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(businessServices)
        .where(where)
        .orderBy(asc(businessServices.sortOrder), asc(businessServices.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db.select({ value: count() }).from(businessServices).where(where),
    ]);
    const total = Number(totalRows[0]?.value ?? 0);

    return {
      services: rows.map(mapOwnerService),
      pagination: makePagination(query.page, query.limit, total),
    };
  },

  async listPublic(businessId: string, query: BusinessServicePublicListQuery) {
    if (!(await isBusinessCapabilityEnabled(businessId, "services"))) {
      return { services: [], pagination: makePagination(query.page, query.limit, 0) };
    }

    const where = and(
      eq(businessServices.businessId, businessId),
      eq(businessServices.status, "active"),
    );
    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(businessServices)
        .where(where)
        .orderBy(asc(businessServices.sortOrder), asc(businessServices.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db.select({ value: count() }).from(businessServices).where(where),
    ]);
    const total = Number(totalRows[0]?.value ?? 0);

    return {
      services: rows.map(mapPublicService),
      pagination: makePagination(query.page, query.limit, total),
    };
  },

  async create(userId: string, businessId: string, payload: BusinessServiceCreate) {
    await assertBusinessCapability(userId, businessId, "services");
    const orderRows = await db
      .select({ value: max(businessServices.sortOrder) })
      .from(businessServices)
      .where(eq(businessServices.businessId, businessId));
    const sortOrder = Number(orderRows[0]?.value ?? -1) + 1;
    const inserted = await db
      .insert(businessServices)
      .values({
        businessId,
        name: payload.name,
        description: cleanOptionalText(payload.description),
        priceType: payload.priceType,
        priceAmount: payload.priceType === "on_request" ? null : payload.priceAmount,
        currency: payload.currency,
        durationMinutes: payload.durationMinutes ?? null,
        status: payload.status,
        sortOrder,
      })
      .returning();

    if (!inserted[0]) throw new Error("Service could not be created");
    return { service: mapOwnerService(inserted[0]) };
  },

  async getById(userId: string, businessId: string, serviceId: string) {
    await assertBusinessCapability(userId, businessId, "services");
    return { service: mapOwnerService(await findService(businessId, serviceId)) };
  },

  async update(
    userId: string,
    businessId: string,
    serviceId: string,
    payload: BusinessServiceUpdate,
  ) {
    await assertBusinessCapability(userId, businessId, "services");
    const current = await findService(businessId, serviceId);
    const valid = BusinessServiceCreateSchema.parse({
      name: payload.name ?? current.name,
      description: payload.description === undefined ? current.description : payload.description,
      priceType: payload.priceType ?? current.priceType,
      priceAmount: payload.priceAmount === undefined ? current.priceAmount : payload.priceAmount,
      currency: payload.currency ?? current.currency,
      durationMinutes:
        payload.durationMinutes === undefined ? current.durationMinutes : payload.durationMinutes,
      status: payload.status ?? current.status,
    });
    const updated = await db
      .update(businessServices)
      .set({
        name: valid.name,
        description: cleanOptionalText(valid.description),
        priceType: valid.priceType,
        priceAmount: valid.priceType === "on_request" ? null : valid.priceAmount,
        currency: valid.currency,
        durationMinutes: valid.durationMinutes ?? null,
        status: valid.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessServices.businessId, businessId),
          eq(businessServices.id, serviceId),
        ),
      )
      .returning();

    if (!updated[0]) throw new ServiceNotFoundError();
    return { service: mapOwnerService(updated[0]) };
  },

  async remove(userId: string, businessId: string, serviceId: string, r2: R2Config) {
    await assertBusinessCapability(userId, businessId, "services");
    const current = await findService(businessId, serviceId);
    const removed = await db
      .delete(businessServices)
      .where(
        and(
          eq(businessServices.businessId, businessId),
          eq(businessServices.id, serviceId),
        ),
      )
      .returning({ id: businessServices.id });

    if (!removed[0]) throw new ServiceNotFoundError();
    await deleteImageWithoutBlocking(r2, current.imageStorageKey);
    return { deleted: true };
  },

  async createImageUpload(
    userId: string,
    businessId: string,
    serviceId: string,
    payload: BusinessServiceImageUpload,
    r2: R2Config,
  ) {
    await assertBusinessCapability(userId, businessId, "services");
    await findService(businessId, serviceId);
    return createServiceImageUpload(r2, { businessId, serviceId, ...payload });
  },

  async confirmImage(
    userId: string,
    businessId: string,
    serviceId: string,
    payload: BusinessServiceImageConfirm,
    r2: R2Config,
  ) {
    await assertBusinessCapability(userId, businessId, "services");
    const current = await findService(businessId, serviceId);
    const image = await confirmServiceImageUpload(r2, {
      businessId,
      serviceId,
      ...payload,
    });
    if (!image) throw new ServiceImageInvalidError();

    const updated = await db
      .update(businessServices)
      .set({ imageUrl: image.publicUrl, imageStorageKey: image.key, updatedAt: new Date() })
      .where(
        and(
          eq(businessServices.businessId, businessId),
          eq(businessServices.id, serviceId),
        ),
      )
      .returning();
    if (!updated[0]) throw new ServiceNotFoundError();

    if (current.imageStorageKey !== image.key) {
      await deleteImageWithoutBlocking(r2, current.imageStorageKey);
    }
    return { service: mapOwnerService(updated[0]) };
  },

  async removeImage(userId: string, businessId: string, serviceId: string, r2: R2Config) {
    await assertBusinessCapability(userId, businessId, "services");
    const current = await findService(businessId, serviceId);
    const updated = await db
      .update(businessServices)
      .set({ imageUrl: null, imageStorageKey: null, updatedAt: new Date() })
      .where(
        and(
          eq(businessServices.businessId, businessId),
          eq(businessServices.id, serviceId),
        ),
      )
      .returning();
    if (!updated[0]) throw new ServiceNotFoundError();

    await deleteImageWithoutBlocking(r2, current.imageStorageKey);
    return { service: mapOwnerService(updated[0]) };
  },
};
