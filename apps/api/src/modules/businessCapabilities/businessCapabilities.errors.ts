import type { BusinessCapabilityKey } from "./businessCapabilities.defaults.js";

const capabilityLabels: Record<BusinessCapabilityKey, string> = {
  menu: "Menu",
  services: "Services",
  products: "Products",
  bookings: "Bookings",
  orders: "Orders",
};

export class BusinessCapabilityDisabledError extends Error {
  readonly code = "BUSINESS_CAPABILITY_DISABLED";
  readonly statusCode = 403;

  constructor(capability: BusinessCapabilityKey) {
    super(
      capability === "menu"
        ? "Menu is not enabled for this business."
        : `${capabilityLabels[capability]} are not enabled for this business.`,
    );
    this.name = "BusinessCapabilityDisabledError";
  }
}
