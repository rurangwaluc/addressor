export type BusinessRole =
  | "business_owner"
  | "business_manager"
  | "business_staff";

export type BusinessAccessItem = {
  businessId: string;
  branchId: string | null;
  role: BusinessRole;
  status: string;
};

export type BusinessMeResponse = {
  userId: string;
  businesses: BusinessAccessItem[];
};