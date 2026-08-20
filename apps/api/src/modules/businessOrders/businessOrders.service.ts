import { and, asc, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import {
  businessOrderItems,
  businessOrderRequests,
  businessOrderSettings,
} from "../../db/schema/business-orders.schema.js";
import type { AuthUser } from "../auth/auth.types.js";
import {
  assertBusinessCapability,
  isBusinessCapabilityEnabled,
} from "../businessCapabilities/businessCapabilities.service.js";
import { BusinessCapabilityDisabledError } from "../businessCapabilities/businessCapabilities.errors.js";
import {
  OrderNotFoundError,
  OrderRequestsDisabledError,
  OrderStatusConflictError,
} from "./businessOrders.errors.js";
import type {
  BusinessOrderCreate,
  BusinessOrderListQuery,
  BusinessOrderNoteUpdate,
  BusinessOrderSettingsUpdate,
  BusinessOrderStatusUpdate,
} from "./businessOrders.validators.js";

type OrderRow = typeof businessOrderRequests.$inferSelect;
type OrderItemRow = typeof businessOrderItems.$inferSelect;

const allowedTransitions: Record<OrderRow["status"], readonly OrderRow["status"][]> = {
  new: ["accepted", "declined"],
  accepted: ["in_progress", "ready", "completed", "cancelled"],
  in_progress: ["ready", "completed", "cancelled"],
  ready: ["completed", "cancelled"],
  declined: [],
  cancelled: [],
  completed: [],
};

function cleanOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function mapItem(row: OrderItemRow) {
  return {
    id: row.id,
    itemName: row.itemName,
    quantity: row.quantity,
    customerNote: row.customerNote,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

function mapOrder(row: OrderRow, items: OrderItemRow[] = []) {
  return {
    id: row.id,
    businessId: row.businessId,
    customerUserId: row.customerUserId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    fulfillmentType: row.fulfillmentType,
    deliveryAddress: row.deliveryAddress,
    customerNote: row.customerNote,
    status: row.status,
    ownerNote: row.ownerNote,
    respondedAt: row.respondedAt,
    startedAt: row.startedAt,
    readyAt: row.readyAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map(mapItem),
  };
}

async function findOrder(businessId: string, orderId: string) {
  const rows = await db
    .select()
    .from(businessOrderRequests)
    .where(and(eq(businessOrderRequests.businessId, businessId), eq(businessOrderRequests.id, orderId)))
    .limit(1);
  if (!rows[0]) throw new OrderNotFoundError();
  return rows[0];
}

async function findItems(orderId: string) {
  return db
    .select()
    .from(businessOrderItems)
    .where(eq(businessOrderItems.orderId, orderId))
    .orderBy(asc(businessOrderItems.sortOrder));
}

function statusConflictMessage(currentStatus: string) {
  if (currentStatus === "new") return "A new order can only be accepted or declined.";
  if (currentStatus === "accepted") return "An accepted order can only be started, marked ready, completed, or cancelled.";
  if (currentStatus === "in_progress") return "An order in progress can only be marked ready, completed, or cancelled.";
  if (currentStatus === "ready") return "A ready order can only be completed or cancelled.";
  return `This order is already ${currentStatus.replace("_", " ")} and cannot be changed.`;
}

export const businessOrdersService = {
  async createCustomerOrder(user: AuthUser, businessId: string, payload: BusinessOrderCreate) {
    if (!(await isBusinessCapabilityEnabled(businessId, "orders"))) {
      throw new BusinessCapabilityDisabledError("orders");
    }

    const settingsRows = await db
      .select()
      .from(businessOrderSettings)
      .where(eq(businessOrderSettings.businessId, businessId))
      .limit(1);
    if (!settingsRows[0]?.enabled) throw new OrderRequestsDisabledError();

    return db.transaction(async (tx) => {
      const insertedOrders = await tx
        .insert(businessOrderRequests)
        .values({
          businessId,
          customerUserId: user.id,
          customerName: user.fullName,
          customerPhone: user.phone,
          customerEmail: user.email,
          fulfillmentType: payload.fulfillmentType,
          deliveryAddress:
            payload.fulfillmentType === "delivery"
              ? cleanOptionalText(payload.deliveryAddress)
              : null,
          customerNote: cleanOptionalText(payload.customerNote),
        })
        .returning();
      const order = insertedOrders[0];
      if (!order) throw new Error("Order request could not be created");

      const items = await tx
        .insert(businessOrderItems)
        .values(payload.items.map((item, sortOrder) => ({
          orderId: order.id,
          itemName: item.itemName,
          quantity: item.quantity,
          customerNote: cleanOptionalText(item.customerNote),
          sortOrder,
        })))
        .returning();

      if (items.length !== payload.items.length) {
        throw new Error("Order items could not be created");
      }
      return { order: mapOrder(order, items) };
    });
  },

  async getSettings(userId: string, businessId: string) {
    await assertBusinessCapability(userId, businessId, "orders");
    const rows = await db
      .select()
      .from(businessOrderSettings)
      .where(eq(businessOrderSettings.businessId, businessId))
      .limit(1);
    return rows[0] ?? {
      businessId,
      enabled: false,
      instructions: null,
      createdAt: null,
      updatedAt: null,
    };
  },

  async updateSettings(userId: string, businessId: string, payload: BusinessOrderSettingsUpdate) {
    await assertBusinessCapability(userId, businessId, "orders");

    const existingRows = await db
      .select()
      .from(businessOrderSettings)
      .where(eq(businessOrderSettings.businessId, businessId))
      .limit(1);

    const existing = existingRows[0];
    const enabled = payload.enabled ?? existing?.enabled ?? false;
    const instructions =
      payload.instructions !== undefined
        ? cleanOptionalText(payload.instructions) ?? null
        : existing?.instructions ?? null;
    const updatedAt = new Date();

    const rows = await db
      .insert(businessOrderSettings)
      .values({
        businessId,
        enabled,
        instructions,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: businessOrderSettings.businessId,
        set: {
          enabled,
          instructions,
          updatedAt,
        },
      })
      .returning();

    if (!rows[0]) throw new Error("Order settings could not be updated");

    return rows[0];
  },

  async list(userId: string, businessId: string, query: BusinessOrderListQuery) {
    await assertBusinessCapability(userId, businessId, "orders");
    const viewStatuses: Record<BusinessOrderListQuery["view"], OrderRow["status"][]> = {
      attention: ["new"],
      active: ["accepted", "in_progress", "ready"],
      history: ["completed", "declined", "cancelled"],
    };
    const conditions: SQL[] = [
      eq(businessOrderRequests.businessId, businessId),
      inArray(businessOrderRequests.status, viewStatuses[query.view]),
    ];
    const where = and(...conditions);
    const [rows, totalRows, countRows] = await Promise.all([
      db
        .select()
        .from(businessOrderRequests)
        .where(where)
        .orderBy(
          query.view === "attention" ? desc(businessOrderRequests.createdAt) : desc(businessOrderRequests.updatedAt),
        )
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db.select({ value: count() }).from(businessOrderRequests).where(where),
      db
        .select({
          attention: sql<number>`count(*) filter (where ${businessOrderRequests.status} = 'new')`,
          active: sql<number>`count(*) filter (where ${businessOrderRequests.status} in ('accepted', 'in_progress', 'ready'))`,
          history: sql<number>`count(*) filter (where ${businessOrderRequests.status} in ('completed', 'declined', 'cancelled'))`,
        })
        .from(businessOrderRequests)
        .where(eq(businessOrderRequests.businessId, businessId)),
    ]);
    const orderIds = rows.map((row) => row.id);
    const itemRows = orderIds.length
      ? await db
          .select()
          .from(businessOrderItems)
          .where(inArray(businessOrderItems.orderId, orderIds))
          .orderBy(asc(businessOrderItems.sortOrder))
      : [];
    const itemsByOrder = new Map<string, OrderItemRow[]>();
    for (const item of itemRows) {
      const items = itemsByOrder.get(item.orderId) ?? [];
      items.push(item);
      itemsByOrder.set(item.orderId, items);
    }
    const total = Number(totalRows[0]?.value ?? 0);
    const totalPages = Math.ceil(total / query.limit);
    const counts = countRows[0];
    return {
      orders: rows.map((row) => mapOrder(row, itemsByOrder.get(row.id))),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasPreviousPage: query.page > 1,
        hasNextPage: query.page < totalPages,
      },
      counts: {
        attention: Number(counts?.attention ?? 0),
        active: Number(counts?.active ?? 0),
        history: Number(counts?.history ?? 0),
      },
    };
  },

  async getById(userId: string, businessId: string, orderId: string) {
    await assertBusinessCapability(userId, businessId, "orders");
    const order = await findOrder(businessId, orderId);
    return { order: mapOrder(order, await findItems(order.id)) };
  },

  async updateStatus(
    userId: string,
    businessId: string,
    orderId: string,
    payload: BusinessOrderStatusUpdate,
  ) {
    await assertBusinessCapability(userId, businessId, "orders");
    const order = await findOrder(businessId, orderId);
    if (!allowedTransitions[order.status].includes(payload.status)) {
      throw new OrderStatusConflictError(statusConflictMessage(order.status));
    }
    const now = new Date();
    const lifecycle: Partial<typeof businessOrderRequests.$inferInsert> = {
      status: payload.status,
      updatedAt: now,
    };
    if (payload.status === "accepted" || payload.status === "declined") lifecycle.respondedAt = now;
    if (payload.status === "in_progress") lifecycle.startedAt = now;
    if (payload.status === "ready") lifecycle.readyAt = now;
    if (payload.status === "completed") lifecycle.completedAt = now;
    if (payload.status === "cancelled") lifecycle.cancelledAt = now;

    const rows = await db
      .update(businessOrderRequests)
      .set(lifecycle)
      .where(and(eq(businessOrderRequests.businessId, businessId), eq(businessOrderRequests.id, orderId)))
      .returning();
    if (!rows[0]) throw new Error("Order request could not be updated");
    return { order: mapOrder(rows[0], await findItems(orderId)) };
  },

  async updateNote(
    userId: string,
    businessId: string,
    orderId: string,
    payload: BusinessOrderNoteUpdate,
  ) {
    await assertBusinessCapability(userId, businessId, "orders");
    await findOrder(businessId, orderId);
    const rows = await db
      .update(businessOrderRequests)
      .set({ ownerNote: cleanOptionalText(payload.ownerNote), updatedAt: new Date() })
      .where(and(eq(businessOrderRequests.businessId, businessId), eq(businessOrderRequests.id, orderId)))
      .returning();
    if (!rows[0]) throw new Error("Order note could not be updated");
    return { order: mapOrder(rows[0], await findItems(orderId)) };
  },
};
