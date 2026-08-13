CREATE TABLE IF NOT EXISTS "business_capabilities" (
  "business_id" uuid PRIMARY KEY NOT NULL,
  "menu" boolean DEFAULT false NOT NULL,
  "services" boolean DEFAULT false NOT NULL,
  "products" boolean DEFAULT false NOT NULL,
  "bookings" boolean DEFAULT false NOT NULL,
  "orders" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "business_capabilities_business_id_businesses_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id")
    ON DELETE cascade ON UPDATE no action
);

INSERT INTO "business_capabilities" (
  "business_id", "menu", "services", "products", "bookings", "orders"
)
SELECT
  "id",
  CASE
    WHEN lower(trim("category")) IN ('restaurant', 'cafe', 'café', 'lounge', 'nightlife') THEN true
    WHEN lower(trim("display_name")) = 'addressor business group' THEN true
    ELSE false
  END,
  CASE
    WHEN lower(trim("category")) IN (
      'hotel', 'stay', 'guest house', 'guesthouse', 'event', 'event place', 'event venue', 'event_venue',
      'tour experience', 'experience', 'tour_operator', 'tour operator', 'wellness'
    ) THEN true
    ELSE false
  END,
  CASE WHEN lower(trim("category")) = 'shop' THEN true ELSE false END,
  CASE
    WHEN lower(trim("category")) IN (
      'restaurant', 'cafe', 'café', 'hotel', 'stay', 'guest house', 'guesthouse',
      'lounge', 'nightlife', 'event', 'event place', 'event venue', 'event_venue', 'tour experience',
      'experience', 'tour_operator', 'tour operator', 'wellness'
    ) THEN true
    WHEN lower(trim("display_name")) = 'addressor business group' THEN true
    ELSE false
  END,
  CASE
    WHEN lower(trim("category")) IN ('restaurant', 'cafe', 'café', 'lounge', 'shop') THEN true
    ELSE false
  END
FROM "businesses"
ON CONFLICT ("business_id") DO NOTHING;
