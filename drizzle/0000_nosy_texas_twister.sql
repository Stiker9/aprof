CREATE TYPE "public"."bumper_cut" AS ENUM('not_required', 'required', 'unknown');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"source_url" text,
	"product_count" integer DEFAULT 0 NOT NULL,
	"model_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fitments" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"price" integer,
	"delivery_text" text
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country" text,
	CONSTRAINT "manufacturers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"source_url" text,
	"product_count" integer DEFAULT 0 NOT NULL,
	"variant_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"article" text NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"description" text NOT NULL,
	"source_price" integer NOT NULL,
	"delivery_text" text,
	"in_stock" boolean DEFAULT false NOT NULL,
	"ball_type" text,
	"tow_load_kg" integer,
	"vertical_load_kg" integer,
	"weight_kg" real,
	"bumper_cut" "bumper_cut" DEFAULT 'unknown' NOT NULL,
	"electrics_included" boolean,
	"source_url" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"generation" text,
	"year_from" integer,
	"year_to" integer,
	"source_url" text,
	"product_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"has_own_page" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fitments" ADD CONSTRAINT "fitments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitments" ADD CONSTRAINT "fitments_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brands_published_idx" ON "brands" USING btree ("is_published");--> statement-breakpoint
CREATE UNIQUE INDEX "fitments_product_variant_idx" ON "fitments" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE INDEX "fitments_variant_idx" ON "fitments" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "models_brand_slug_idx" ON "models" USING btree ("brand_id","slug");--> statement-breakpoint
CREATE INDEX "products_manufacturer_idx" ON "products" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_model_slug_idx" ON "variants" USING btree ("model_id","slug");