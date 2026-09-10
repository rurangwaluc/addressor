CREATE INDEX IF NOT EXISTS "business_booking_requests_customer_created_idx"
  ON "business_booking_requests" ("customer_user_id", "created_at");
