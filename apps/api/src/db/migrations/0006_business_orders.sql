CREATE TABLE IF NOT EXISTS "business_order_settings" (
  "business_id" uuid PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "instructions" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "business_order_settings_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "business_order_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "customer_user_id" uuid NOT NULL,
  "customer_name" text NOT NULL,
  "customer_phone" text,
  "customer_email" text,
  "fulfillment_type" text NOT NULL,
  "delivery_address" text,
  "customer_note" text,
  "status" text DEFAULT 'new' NOT NULL,
  "owner_note" text,
  "responded_at" timestamp with time zone,
  "started_at" timestamp with time zone,
  "ready_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "business_order_requests_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "business_order_requests_customer_user_id_users_id_fk"
    FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id")
    ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "business_order_requests_fulfillment_type_check"
    CHECK ("fulfillment_type" IN ('pickup', 'delivery', 'on_site')),
  CONSTRAINT "business_order_requests_delivery_address_check"
    CHECK ("fulfillment_type" <> 'delivery' OR ("delivery_address" IS NOT NULL AND length(btrim("delivery_address")) > 0)),
  CONSTRAINT "business_order_requests_status_check"
    CHECK ("status" IN ('new', 'accepted', 'in_progress', 'ready', 'declined', 'cancelled', 'completed'))
);

CREATE TABLE IF NOT EXISTS "business_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "item_name" text NOT NULL,
  "quantity" integer NOT NULL,
  "customer_note" text,
  "sort_order" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "business_order_items_order_id_business_order_requests_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "public"."business_order_requests"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "business_order_items_quantity_check" CHECK ("quantity" BETWEEN 1 AND 99),
  CONSTRAINT "business_order_items_sort_order_check" CHECK ("sort_order" >= 0),
  CONSTRAINT "business_order_items_order_sort_order_unique" UNIQUE("order_id", "sort_order")
);

CREATE INDEX IF NOT EXISTS "business_order_requests_business_status_updated_idx"
  ON "business_order_requests" ("business_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "business_order_requests_customer_created_idx"
  ON "business_order_requests" ("customer_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "business_order_items_order_idx"
  ON "business_order_items" ("order_id");
