import { apiRequest } from "../api/client";

export type UserRole = "platform" | "business" | "customer";

export async function resolveRole(
  token: string,
): Promise<UserRole> {
  // 1. Check platform
  try {
    await apiRequest("/platform/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return "platform";
  } catch {}

  // 2. Check business
  try {
    await apiRequest("/business/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return "business";
  } catch {}

  // 3. Default → customer
  return "customer";
}