ALTER TABLE "business_reviews"
  ADD COLUMN "order_request_id" uuid,
  ADD COLUMN "booking_request_id" uuid;

ALTER TABLE "business_reviews"
  ALTER COLUMN "status" SET DEFAULT 'published';

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_order_request_id_business_order_requests_id_fk"
  FOREIGN KEY ("order_request_id")
  REFERENCES "business_order_requests"("id")
  ON DELETE CASCADE;

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_booking_request_id_business_booking_requests_id_fk"
  FOREIGN KEY ("booking_request_id")
  REFERENCES "business_booking_requests"("id")
  ON DELETE CASCADE;

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_rating_check"
  CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_status_check"
  CHECK ("status" IN ('published', 'hidden'));

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_source_check"
  CHECK (
    ("order_request_id" IS NOT NULL AND "booking_request_id" IS NULL)
    OR
    ("order_request_id" IS NULL AND "booking_request_id" IS NOT NULL)
  );

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_order_request_unique"
  UNIQUE ("order_request_id");

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_booking_request_unique"
  UNIQUE ("booking_request_id");

CREATE INDEX "business_reviews_business_status_created_idx"
  ON "business_reviews" ("business_id", "status", "created_at");

CREATE INDEX "business_reviews_customer_created_idx"
  ON "business_reviews" ("customer_user_id", "created_at");
