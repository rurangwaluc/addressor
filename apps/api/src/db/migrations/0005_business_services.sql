CREATE TABLE IF NOT EXISTS "business_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "price_type" text NOT NULL,
  "price_amount" integer,
  "currency" text DEFAULT 'RWF' NOT NULL,
  "duration_minutes" integer,
  "image_url" text,
  "image_storage_key" text,
  "status" text DEFAULT 'active' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "business_services_price_type_check"
    CHECK ("price_type" IN ('fixed', 'starting_from', 'on_request')),
  CONSTRAINT "business_services_status_check"
    CHECK ("status" IN ('active', 'inactive')),
  CONSTRAINT "business_services_pricing_check"
    CHECK (
      ("price_type" IN ('fixed', 'starting_from') AND "price_amount" > 0)
      OR ("price_type" = 'on_request' AND "price_amount" IS NULL)
    ),
  CONSTRAINT "business_services_currency_check" CHECK ("currency" = 'RWF'),
  CONSTRAINT "business_services_duration_check"
    CHECK ("duration_minutes" IS NULL OR "duration_minutes" > 0),
  CONSTRAINT "business_services_sort_order_check" CHECK ("sort_order" >= 0),
  CONSTRAINT "business_services_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "business_services_business_status_order_idx"
  ON "business_services" ("business_id", "status", "sort_order");
