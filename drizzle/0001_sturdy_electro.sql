CREATE TYPE "public"."override_entity" AS ENUM('product', 'review', 'promo', 'work', 'install_price', 'electrics', 'faq', 'contacts', 'ball_photo');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "admin_users_login_unique" UNIQUE("login")
);
--> statement-breakpoint
CREATE TABLE "overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity" "override_entity" NOT NULL,
	"target_key" text NOT NULL,
	"field" text NOT NULL,
	"value" text,
	"author" text NOT NULL,
	"updated_at" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "own_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"article" text NOT NULL,
	"manufacturer_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"ball_type" text,
	"tow_load_kg" integer,
	"vertical_load_kg" integer,
	"bumper_cut" "bumper_cut" DEFAULT 'unknown' NOT NULL,
	"variant_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "own_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"phone" text NOT NULL,
	"car" text,
	"comment" text,
	"page" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "overrides_target_idx" ON "overrides" USING btree ("entity","target_key","field");--> statement-breakpoint
CREATE INDEX "overrides_unpublished_idx" ON "overrides" USING btree ("published");--> statement-breakpoint
CREATE INDEX "requests_status_idx" ON "requests" USING btree ("status");