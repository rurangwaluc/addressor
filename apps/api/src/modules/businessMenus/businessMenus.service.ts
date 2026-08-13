import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import {
  businessMenuFiles,
  businessMenus,
} from "../../db/schema/uploaded-menu.schema.js";
import {
  confirmMenuFileUpload,
  createMenuFileUpload,
  deleteMenuFile,
  type R2Config,
} from "../../lib/storage/r2.js";
import {
  assertBusinessCapability,
  isBusinessCapabilityEnabled,
} from "../businessCapabilities/businessCapabilities.service.js";
import type {
  BusinessMenuReorderSchemaType,
  BusinessMenuUploadSchemaType,
} from "./businessMenus.validators.js";

const maximumFilesPerMenu = 20;

function mapFile(file: typeof businessMenuFiles.$inferSelect) {
  return {
    id: file.id,
    publicUrl: file.publicUrl,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
    sortOrder: file.sortOrder,
    createdAt: file.createdAt,
  };
}

async function mapMenu(menu: typeof businessMenus.$inferSelect | undefined) {
  if (!menu) return null;

  const files = await db
    .select()
    .from(businessMenuFiles)
    .where(
      and(
        eq(businessMenuFiles.menuId, menu.id),
        isNotNull(businessMenuFiles.confirmedAt),
      ),
    )
    .orderBy(asc(businessMenuFiles.sortOrder), asc(businessMenuFiles.createdAt));

  return {
    id: menu.id,
    status: menu.status,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
    publishedAt: menu.publishedAt,
    files: files.map(mapFile),
  };
}

async function findRevision(businessId: string, revisionId: string) {
  const rows = await db
    .select()
    .from(businessMenus)
    .where(
      and(eq(businessMenus.id, revisionId), eq(businessMenus.businessId, businessId)),
    )
    .limit(1);

  return rows[0];
}

export const businessMenusService = {
  async getOwnerState(userId: string, businessId: string) {
    await assertBusinessCapability(userId, businessId, "menu");

    const menus = await db
      .select()
      .from(businessMenus)
      .where(
        and(
          eq(businessMenus.businessId, businessId),
          inArray(businessMenus.status, ["published", "draft", "unpublished"]),
        ),
      )
      .orderBy(desc(businessMenus.updatedAt));

    const published = menus.find((menu) => menu.status === "published");
    const draft = menus.find((menu) => menu.status === "draft");
    const unpublished = menus.find((menu) => menu.status === "unpublished");

    return {
      published: await mapMenu(published),
      draft: await mapMenu(draft),
      unpublished: await mapMenu(unpublished),
    };
  },

  async getPublished(businessId: string) {
    if (!(await isBusinessCapabilityEnabled(businessId, "menu"))) {
      return { menu: null };
    }
    const rows = await db
      .select()
      .from(businessMenus)
      .where(
        and(
          eq(businessMenus.businessId, businessId),
          eq(businessMenus.status, "published"),
        ),
      )
      .limit(1);

    return { menu: await mapMenu(rows[0]) };
  },

  async createDraft(userId: string, businessId: string) {
    await assertBusinessCapability(userId, businessId, "menu");

    const existing = await db
      .select()
      .from(businessMenus)
      .where(
        and(eq(businessMenus.businessId, businessId), eq(businessMenus.status, "draft")),
      )
      .limit(1);

    if (existing[0]) return mapMenu(existing[0]);

    const inserted = await db
      .insert(businessMenus)
      .values({ businessId, createdBy: userId })
      .returning();

    return mapMenu(inserted[0]);
  },

  async requestUpload(
    userId: string,
    businessId: string,
    revisionId: string,
    payload: BusinessMenuUploadSchemaType,
    r2: R2Config,
  ) {
    await assertBusinessCapability(userId, businessId, "menu");
    const revision = await findRevision(businessId, revisionId);

    if (!revision || revision.status !== "draft") {
      throw new Error("Menu draft was not found");
    }

    const existing = await db
      .select({ id: businessMenuFiles.id })
      .from(businessMenuFiles)
      .where(eq(businessMenuFiles.menuId, revisionId));

    if (existing.length >= maximumFilesPerMenu) {
      throw new Error("A menu can contain up to 20 files");
    }

    const sortOrder = payload.sortOrder ?? existing.length;
    const upload = await createMenuFileUpload(r2, {
      businessId,
      revisionId,
      contentType: payload.contentType,
      size: payload.size,
    });
    const inserted = await db
      .insert(businessMenuFiles)
      .values({
        menuId: revisionId,
        storageKey: upload.key,
        publicUrl: upload.publicUrl,
        contentType: payload.contentType,
        sizeBytes: payload.size,
        sortOrder,
      })
      .returning({ id: businessMenuFiles.id });
    const pendingFile = inserted[0];

    if (!pendingFile) {
      throw new Error("Menu upload could not be prepared");
    }

    return {
      fileId: pendingFile.id,
      uploadUrl: upload.uploadUrl,
      expiresInSeconds: upload.expiresInSeconds,
    };
  },

  async confirmUpload(
    userId: string,
    businessId: string,
    revisionId: string,
    fileId: string,
    r2: R2Config,
  ) {
    await assertBusinessCapability(userId, businessId, "menu");
    const revision = await findRevision(businessId, revisionId);

    if (!revision || revision.status !== "draft") {
      throw new Error("Menu draft was not found");
    }

    const rows = await db
      .select()
      .from(businessMenuFiles)
      .where(
        and(eq(businessMenuFiles.id, fileId), eq(businessMenuFiles.menuId, revisionId)),
      )
      .limit(1);
    const file = rows[0];

    if (!file) throw new Error("Menu file was not found");

    await confirmMenuFileUpload(r2, {
      key: file.storageKey,
      contentType: file.contentType as Parameters<typeof confirmMenuFileUpload>[1]["contentType"],
      size: file.sizeBytes,
    });

    const updated = await db
      .update(businessMenuFiles)
      .set({ confirmedAt: new Date() })
      .where(eq(businessMenuFiles.id, fileId))
      .returning();
    const confirmedFile = updated[0];

    if (!confirmedFile) throw new Error("Menu file could not be confirmed");
    return mapFile(confirmedFile);
  },

  async removeDraftFile(
    userId: string,
    businessId: string,
    revisionId: string,
    fileId: string,
    r2: R2Config,
  ) {
    await assertBusinessCapability(userId, businessId, "menu");
    const revision = await findRevision(businessId, revisionId);

    if (!revision || revision.status !== "draft") {
      throw new Error("Only draft menu files can be removed");
    }

    const rows = await db
      .select()
      .from(businessMenuFiles)
      .where(
        and(eq(businessMenuFiles.id, fileId), eq(businessMenuFiles.menuId, revisionId)),
      )
      .limit(1);
    const file = rows[0];

    if (!file) throw new Error("Menu file was not found");

    await deleteMenuFile(r2, file.storageKey);
    await db.delete(businessMenuFiles).where(eq(businessMenuFiles.id, fileId));

    return { removed: true };
  },

  async reorderDraftFiles(
    userId: string,
    businessId: string,
    revisionId: string,
    payload: BusinessMenuReorderSchemaType,
  ) {
    await assertBusinessCapability(userId, businessId, "menu");
    const updatedRevision = await db.transaction(async (tx) => {
      const now = new Date();
      const revisions = await tx
        .update(businessMenus)
        .set({ updatedAt: now })
        .where(
          and(
            eq(businessMenus.id, revisionId),
            eq(businessMenus.businessId, businessId),
            eq(businessMenus.status, "draft"),
          ),
        )
        .returning();
      const revision = revisions[0];

      if (!revision) {
        throw new Error("Only draft menu files can be reordered");
      }

      const confirmedFiles = await tx
        .select({ id: businessMenuFiles.id })
        .from(businessMenuFiles)
        .where(
          and(
            eq(businessMenuFiles.menuId, revisionId),
            isNotNull(businessMenuFiles.confirmedAt),
          ),
        );
      const confirmedIds = new Set(confirmedFiles.map((file) => file.id));

      if (
        confirmedFiles.length !== payload.fileIds.length ||
        new Set(payload.fileIds).size !== payload.fileIds.length ||
        payload.fileIds.some((fileId) => !confirmedIds.has(fileId))
      ) {
        throw new Error("Menu file order must include every draft file exactly once");
      }

      for (const [sortOrder, fileId] of payload.fileIds.entries()) {
        await tx
          .update(businessMenuFiles)
          .set({ sortOrder })
          .where(
            and(
              eq(businessMenuFiles.id, fileId),
              eq(businessMenuFiles.menuId, revisionId),
            ),
          );
      }

      return revision;
    });

    return mapMenu(updatedRevision);
  },

  async publish(userId: string, businessId: string, revisionId: string) {
    await assertBusinessCapability(userId, businessId, "menu");

    return db.transaction(async (tx) => {
      const revisions = await tx
        .select()
        .from(businessMenus)
        .where(
          and(eq(businessMenus.id, revisionId), eq(businessMenus.businessId, businessId)),
        )
        .limit(1);
      const revision = revisions[0];

      if (!revision || !["draft", "unpublished"].includes(revision.status)) {
        throw new Error("Menu is not ready to publish");
      }

      const files = await tx
        .select({ id: businessMenuFiles.id })
        .from(businessMenuFiles)
        .where(
          and(
            eq(businessMenuFiles.menuId, revisionId),
            isNotNull(businessMenuFiles.confirmedAt),
          ),
        );

      if (files.length === 0) throw new Error("Upload a menu before publishing");

      const now = new Date();
      await tx
        .update(businessMenus)
        .set({ status: "archived", updatedAt: now })
        .where(
          and(
            eq(businessMenus.businessId, businessId),
            eq(businessMenus.status, "published"),
          ),
        );
      const updated = await tx
        .update(businessMenus)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(businessMenus.id, revisionId))
        .returning();

      return updated[0];
    });
  },

  async unpublish(userId: string, businessId: string) {
    await assertBusinessCapability(userId, businessId, "menu");
    const updated = await db
      .update(businessMenus)
      .set({ status: "unpublished", updatedAt: new Date() })
      .where(
        and(
          eq(businessMenus.businessId, businessId),
          eq(businessMenus.status, "published"),
        ),
      )
      .returning();

    if (!updated[0]) throw new Error("Published menu was not found");
    return mapMenu(updated[0]);
  },
};
