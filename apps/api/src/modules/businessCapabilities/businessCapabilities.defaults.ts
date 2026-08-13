export type BusinessCapabilityKey =
  | "menu"
  | "services"
  | "products"
  | "bookings"
  | "orders";

export type BusinessCapabilityValues = Record<BusinessCapabilityKey, boolean>;

export function getDefaultBusinessCapabilities(category: string): BusinessCapabilityValues {
  const normalized = category.trim().toLowerCase();
  const menu = ["restaurant", "cafe", "café", "lounge", "nightlife"].includes(normalized);
  const services = [
    "hotel",
    "stay",
    "guest house",
    "guesthouse",
    "event place",
    "event venue",
    "event",
    "event_venue",
    "tour experience",
    "experience",
    "tour_operator",
    "tour operator",
    "wellness",
  ].includes(normalized);
  const products = normalized === "shop";
  const bookings = menu || services;
  const orders = ["restaurant", "cafe", "café", "lounge", "shop"].includes(normalized);

  return { menu, services, products, bookings, orders };
}
