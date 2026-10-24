CREATE TABLE "product_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_slug" text NOT NULL,
	"model_key" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "product_photos_slug_idx" ON "product_photos" USING btree ("product_slug","model_key","position");
--> statement-breakpoint
-- Фото, загруженные раньше одной штукой (правка «photo» у товара),
-- становятся первыми общими фото — владелец ничего не теряет.
INSERT INTO "product_photos" ("product_slug", "model_key", "url", "position", "created_at")
SELECT "target_key", '', "value", 0, "updated_at"
FROM "overrides"
WHERE "entity" = 'product' AND "field" = 'photo' AND coalesce("value", '') <> '';
--> statement-breakpoint
-- Если перенесённое фото ещё не было на сайте — товар остаётся в очереди
-- публикации служебной меткой.
INSERT INTO "overrides" ("entity", "target_key", "field", "value", "author", "updated_at", "published")
SELECT 'product', "target_key", '__dirty', NULL, "author", "updated_at", false
FROM "overrides"
WHERE "entity" = 'product' AND "field" = 'photo' AND "published" = false
ON CONFLICT ("entity", "target_key", "field") DO NOTHING;
--> statement-breakpoint
DELETE FROM "overrides" WHERE "entity" = 'product' AND "field" = 'photo';
