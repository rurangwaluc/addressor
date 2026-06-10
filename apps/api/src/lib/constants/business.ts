export const BUSINESS_CATEGORIES = [
  "restaurant",
  "nightlife",
  "stay",
  "event_venue",
  "experience",
  "tour_operator",
] as const;

export const BUSINESS_VERIFICATION_STATUSES = [
  "draft",
  "pending",
  "verified",
  "rejected",
] as const;

export const BUSINESS_ONBOARDING_STATUSES = [
  "draft",
  "in_review",
  "live",
] as const;

export const BUSINESS_SUBSCRIPTION_STATUSES = [
  "free",
  "pro",
  "premium",
  "past_due",
  "cancelled",
] as const;