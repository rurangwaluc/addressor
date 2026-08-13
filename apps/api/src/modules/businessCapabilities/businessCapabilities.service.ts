import { eq } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import { businessCapabilities } from "../../db/schema/businesses.schema.js";
import { assertCanEditBusiness } from "../businesses/businesses.service.js";
import type { BusinessCapabilityKey } from "./businessCapabilities.defaults.js";
import { BusinessCapabilityDisabledError } from "./businessCapabilities.errors.js";
import type { BusinessCapabilitiesUpdate } from "./businessCapabilities.validators.js";

export const emptyBusinessCapabilities = {
  menu: false,
  services: false,
  products: false,
  bookings: false,
  orders: false,
};

export function mapBusinessCapabilities(
  row: typeof businessCapabilities.$inferSelect | null | undefined,
) {
  return row
    ? {
        menu: row.menu,
        services: row.services,
        products: row.products,
        bookings: row.bookings,
        orders: row.orders,
      }
    : { ...emptyBusinessCapabilities };
}

async function findCapabilities(businessId: string) {
  const rows = await db
    .select()
    .from(businessCapabilities)
    .where(eq(businessCapabilities.businessId, businessId))
    .limit(1);

  return rows[0] ?? null;
}

export async function assertBusinessCapability(
  userId: string,
  businessId: string,
  capability: BusinessCapabilityKey,
) {
  await assertCanEditBusiness(userId, businessId);
  const values = mapBusinessCapabilities(await findCapabilities(businessId));

  if (!values[capability]) throw new BusinessCapabilityDisabledError(capability);
  return values;
}

export async function isBusinessCapabilityEnabled(
  businessId: string,
  capability: BusinessCapabilityKey,
) {
  const values = mapBusinessCapabilities(await findCapabilities(businessId));
  return values[capability];
}

export const businessCapabilitiesService = {
  async get(userId: string, businessId: string) {
    await assertCanEditBusiness(userId, businessId);
    return { capabilities: mapBusinessCapabilities(await findCapabilities(businessId)) };
  },

  async update(userId: string, businessId: string, payload: BusinessCapabilitiesUpdate) {
    await assertCanEditBusiness(userId, businessId);
    const updated = await db
      .update(businessCapabilities)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(businessCapabilities.businessId, businessId))
      .returning();

    if (!updated[0]) throw new Error("Business capabilities could not be updated");
    return { capabilities: mapBusinessCapabilities(updated[0]) };
  },
};
