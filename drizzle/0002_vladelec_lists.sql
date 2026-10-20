CREATE TABLE "promos" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"lead" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"discount" text DEFAULT '' NOT NULL,
	"discount_note" text DEFAULT '' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"until" text,
	"visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "promos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"author" text NOT NULL,
	"car" text DEFAULT '' NOT NULL,
	"text" text NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" serial PRIMARY KEY NOT NULL,
	"car" text NOT NULL,
	"article" text DEFAULT '' NOT NULL,
	"photo" text NOT NULL,
	"href" text DEFAULT '' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "promos_visible_idx" ON "promos" USING btree ("visible");--> statement-breakpoint
CREATE INDEX "reviews_visible_idx" ON "reviews" USING btree ("visible");--> statement-breakpoint
CREATE INDEX "works_visible_idx" ON "works" USING btree ("visible");