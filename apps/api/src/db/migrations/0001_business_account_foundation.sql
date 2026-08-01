CREATE TABLE IF NOT EXISTS "business_profile_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "viewer_user_id" uuid,
  "visitor_key" text,
  "source" text,
  "user_agent" text,
  "ip_address" text,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "business_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "customer_user_id" uuid,
  "customer_name" text,
  "rating" integer NOT NULL,
  "title" text,
  "body" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "owner_reply" text,
  "owner_replied_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "business_review_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "review_id" uuid NOT NULL,
  "author_user_id" uuid,
  "author_name" text,
  "body" text NOT NULL,
  "status" text DEFAULT 'visible' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "business_booking_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "customer_user_id" uuid,
  "customer_name" text NOT NULL,
  "customer_phone" text,
  "customer_email" text,
  "request_type" text DEFAULT 'booking' NOT NULL,
  "message" text,
  "preferred_date" timestamp with time zone,
  "party_size" integer,
  "status" text DEFAULT 'new' NOT NULL,
  "owner_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "business_menu_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "business_menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "category_id" uuid,
  "name" text NOT NULL,
  "description" text,
  "price_text" text,
  "image_url" text,
  "status" text DEFAULT 'available' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "business_update_subscribers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "user_id" uuid,
  "name" text,
  "email" text,
  "phone" text,
  "channel" text DEFAULT 'email' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "business_profile_views"
  ADD CONSTRAINT "business_profile_views_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_profile_views"
  ADD CONSTRAINT "business_profile_views_viewer_user_id_users_id_fk"
  FOREIGN KEY ("viewer_user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_reviews"
  ADD CONSTRAINT "business_reviews_customer_user_id_users_id_fk"
  FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;

ALTER TABLE "business_review_comments"
  ADD CONSTRAINT "business_review_comments_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_review_comments"
  ADD CONSTRAINT "business_review_comments_review_id_business_reviews_id_fk"
  FOREIGN KEY ("review_id") REFERENCES "public"."business_reviews"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_review_comments"
  ADD CONSTRAINT "business_review_comments_author_user_id_users_id_fk"
  FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;

ALTER TABLE "business_booking_requests"
  ADD CONSTRAINT "business_booking_requests_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_booking_requests"
  ADD CONSTRAINT "business_booking_requests_customer_user_id_users_id_fk"
  FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;

ALTER TABLE "business_menu_categories"
  ADD CONSTRAINT "business_menu_categories_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_menu_items"
  ADD CONSTRAINT "business_menu_items_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_menu_items"
  ADD CONSTRAINT "business_menu_items_category_id_business_menu_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."business_menu_categories"("id")
  ON DELETE set null ON UPDATE no action;

ALTER TABLE "business_update_subscribers"
  ADD CONSTRAINT "business_update_subscribers_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_update_subscribers"
  ADD CONSTRAINT "business_update_subscribers_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;

ALTER TABLE "business_update_subscribers"
  ADD CONSTRAINT "business_update_subscribers_business_email_unique"
  UNIQUE ("business_id", "email");

ALTER TABLE "business_update_subscribers"
  ADD CONSTRAINT "business_update_subscribers_business_phone_unique"
  UNIQUE ("business_id", "phone");
