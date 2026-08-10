CREATE TABLE IF NOT EXISTS "business_menus" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "published_at" timestamp with time zone,
  CONSTRAINT "business_menus_status_check"
    CHECK ("status" IN ('draft', 'published', 'unpublished', 'archived'))
);

CREATE TABLE IF NOT EXISTS "business_menu_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_id" uuid NOT NULL,
  "storage_key" text NOT NULL UNIQUE,
  "public_url" text NOT NULL,
  "content_type" text NOT NULL,
  "size_bytes" bigint NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "confirmed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "business_menu_files_content_type_check"
    CHECK ("content_type" IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT "business_menu_files_size_check" CHECK ("size_bytes" > 0),
  CONSTRAINT "business_menu_files_sort_order_check" CHECK ("sort_order" >= 0)
);

ALTER TABLE "business_menus"
  ADD CONSTRAINT "business_menus_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "business_menus"
  ADD CONSTRAINT "business_menus_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
  ON DELETE restrict ON UPDATE no action;

ALTER TABLE "business_menu_files"
  ADD CONSTRAINT "business_menu_files_menu_id_business_menus_id_fk"
  FOREIGN KEY ("menu_id") REFERENCES "public"."business_menus"("id")
  ON DELETE cascade ON UPDATE no action;

CREATE INDEX "business_menus_business_status_idx"
  ON "business_menus" ("business_id", "status");

CREATE UNIQUE INDEX "business_menus_one_published_idx"
  ON "business_menus" ("business_id") WHERE "status" = 'published';

CREATE UNIQUE INDEX "business_menus_one_draft_idx"
  ON "business_menus" ("business_id") WHERE "status" = 'draft';

CREATE INDEX "business_menu_files_menu_order_idx"
  ON "business_menu_files" ("menu_id", "sort_order");
