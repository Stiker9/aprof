-- Машины, фаркопы и совместимость, добавленные владельцем в админке.
-- Хранятся в тех же таблицах, что и выгрузка поставщика, — тогда
-- каталог, фильтры и подбор видят их без отдельной логики. Пометка
-- нужна, чтобы отличать своё: удалять владелец может только своё, и
-- админка показывает, что добавлено им.
ALTER TABLE "brands" ADD COLUMN "added_by_owner" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "added_by_owner" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "variants" ADD COLUMN "added_by_owner" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "added_by_owner" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "fitments" ADD COLUMN "added_by_owner" boolean DEFAULT false NOT NULL;
