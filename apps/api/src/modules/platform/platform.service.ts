import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import { roles, userRoles } from "../../db/schema/roles.schema.js";
import {
  PlatformAccessResult,
  PlatformMeResponse,
  PlatformRole,
} from "./platform.types.js";

const PLATFORM_ROLES: PlatformRole[] = [
  "platform_owner",
  "platform_admin",
  "platform_support",
];

const ROLE_PRIORITY: Record<PlatformRole, number> = {
  platform_owner: 3,
  platform_admin: 2,
  platform_support: 1,
};

const ROLE_PERMISSIONS: Record<PlatformRole, string[]> = {
  platform_owner: [
    "platform.full_access",
    "platform.manage_admins",
    "platform.manage_support",
    "platform.manage_businesses",
    "platform.manage_users",
    "platform.manage_revenue",
    "platform.manage_settings",
  ],
  platform_admin: [
    "platform.manage_businesses",
    "platform.manage_users",
    "platform.manage_revenue",
  ],
  platform_support: [
    "platform.view_businesses",
    "platform.view_users",
    "platform.support_actions",
  ],
};

function sortPlatformRolesByPower(rows: { role: string }[]) {
  return rows
    .filter((row): row is { role: PlatformRole } =>
      PLATFORM_ROLES.includes(row.role as PlatformRole),
    )
    .sort((a, b) => ROLE_PRIORITY[b.role] - ROLE_PRIORITY[a.role]);
}

export const platformService = {
  async getPlatformAccess(userId: string): Promise<PlatformAccessResult> {
    const rows = await db
      .select({
        role: roles.key,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          inArray(roles.key, PLATFORM_ROLES),
        ),
      );

    const sorted = sortPlatformRolesByPower(rows);
    const role = sorted[0]?.role ?? null;

    return {
      hasAccess: Boolean(role),
      role,
    };
  },

  async getMe(userId: string): Promise<PlatformMeResponse> {
    const access = await this.getPlatformAccess(userId);

    if (!access.hasAccess || !access.role) {
      throw new Error("Platform access denied");
    }

    return {
      userId,
      role: access.role,
      permissions: ROLE_PERMISSIONS[access.role],
    };
  },
};