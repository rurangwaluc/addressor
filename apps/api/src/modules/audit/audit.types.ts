export type AuditMetadata = Record<string, unknown>;

export type CreateAuditLogInput = {
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  metadata?: AuditMetadata | null;
};
