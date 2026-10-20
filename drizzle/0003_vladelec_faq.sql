CREATE TABLE "faq" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" text DEFAULT 'home' NOT NULL,
	"question" text NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "faq_scope_idx" ON "faq" USING btree ("scope","visible");