const ACTIVE_BUSINESS_KEY = "addressorActiveBusinessId";

export type SelectableBusiness = {
  id?: string;
  businessId?: string;
  displayName?: string;
  businessName?: string;
};

export function getBusinessId(business: SelectableBusiness | null | undefined) {
  return business?.id ?? business?.businessId ?? "";
}

export function getBusinessName(business: SelectableBusiness | null | undefined) {
  return business?.displayName ?? business?.businessName ?? "Business";
}

export function getStoredActiveBusinessId() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(ACTIVE_BUSINESS_KEY) ?? "";
}

export function saveActiveBusinessId(businessId: string) {
  if (typeof window === "undefined" || !businessId) {
    return;
  }

  localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
}

export function chooseActiveBusiness<T extends SelectableBusiness>(
  businesses: T[] | null | undefined,
) {
  if (!businesses?.length) {
    return null;
  }

  const storedBusinessId = getStoredActiveBusinessId();
  const storedBusiness = businesses.find(
    (business) => getBusinessId(business) === storedBusinessId,
  );

  if (storedBusiness) {
    return storedBusiness;
  }

  const firstBusiness = businesses[0];
  const firstBusinessId = getBusinessId(firstBusiness);

  if (firstBusinessId) {
    saveActiveBusinessId(firstBusinessId);
  }

  return firstBusiness;
}
