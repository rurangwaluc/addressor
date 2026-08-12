CREATE TABLE "business_booking_settings" (
  "business_id" uuid PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "booking_label" text,
  "instructions" text,
  "minimum_advance_minutes" integer,
  "maximum_advance_days" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "business_booking_settings_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "business_booking_settings_minimum_advance_check"
    CHECK ("minimum_advance_minutes" IS NULL OR "minimum_advance_minutes" BETWEEN 0 AND 525600),
  CONSTRAINT "business_booking_settings_maximum_advance_check"
    CHECK ("maximum_advance_days" IS NULL OR "maximum_advance_days" BETWEEN 1 AND 730)
);

ALTER TABLE "business_booking_requests"
  ADD COLUMN "confirmed_date" timestamp with time zone,
  ADD COLUMN "responded_at" timestamp with time zone,
  ADD COLUMN "completed_at" timestamp with time zone,
  ADD COLUMN "cancelled_at" timestamp with time zone;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "business_booking_requests"
    WHERE "status" NOT IN ('new', 'accepted', 'declined', 'cancelled', 'completed')
  ) THEN
    RAISE EXCEPTION 'business_booking_requests contains unsupported status values';
  END IF;
END $$;

ALTER TABLE "business_booking_requests"
  ADD CONSTRAINT "business_booking_requests_status_check"
  CHECK ("status" IN ('new', 'accepted', 'declined', 'cancelled', 'completed'));

CREATE INDEX "business_booking_requests_business_status_idx"
  ON "business_booking_requests" ("business_id", "status");

CREATE INDEX "business_booking_requests_business_preferred_date_idx"
  ON "business_booking_requests" ("business_id", "preferred_date");

CREATE INDEX "business_booking_requests_business_confirmed_date_idx"
  ON "business_booking_requests" ("business_id", "confirmed_date");
