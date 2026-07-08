import { db } from "../../app/plugins/db.plugin.js";
import { auditLogs } from "../../db/schema/audit.schema.js";
import type { CreateAuditLogInput } from "./audit.types.js";

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    await db.insert(auditLogs).values({
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      metadataJson: input.metadata ?? null,
    });
  } catch (error) {
    console.error("[AUDIT_LOG_FAILED]", error);
  }
}

export const auditService = {
  create: createAuditLog,
};
