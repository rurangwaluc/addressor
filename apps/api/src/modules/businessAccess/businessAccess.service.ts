import { and, eq } from "drizzle-orm";
import { db } from "../../app/plugins/db.plugin.js";
import { businessTeamMembers } from "../../db/schema/businesses.schema.js";
import { BusinessAccessItem, BusinessMeResponse } from "./businessAccess.types.js";

export const businessAccessService = {
  async getBusinessAccess(userId: string): Promise<BusinessAccessItem[]> {
    const rows = await db
      .select({
        businessId: businessTeamMembers.businessId,
        branchId: businessTeamMembers.branchId,
        role: businessTeamMembers.role,
        status: businessTeamMembers.status,
      })
      .from(businessTeamMembers)
      .where(eq(businessTeamMembers.userId, userId));

    return rows
      .filter((row) => row.status === "active")
      .map((row) => ({
        businessId: row.businessId,
        branchId: row.branchId,
        role: row.role as BusinessAccessItem["role"],
        status: row.status,
      }));
  },

  async isActiveBusinessMember(
    userId: string,
    businessId: string,
  ): Promise<boolean> {
    const rows = await db
      .select({ id: businessTeamMembers.id })
      .from(businessTeamMembers)
      .where(
        and(
          eq(businessTeamMembers.userId, userId),
          eq(businessTeamMembers.businessId, businessId),
          eq(businessTeamMembers.status, "active"),
        ),
      )
      .limit(1);

    return Boolean(rows[0]);
  },

  async getMe(userId: string): Promise<BusinessMeResponse> {
    const businesses = await this.getBusinessAccess(userId);

    if (businesses.length === 0) {
      throw new Error("Business access denied");
    }

    return {
      userId,
      businesses,
    };
  },
};