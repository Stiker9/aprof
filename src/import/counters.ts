import { sql } from 'drizzle-orm'
import { rowsOf, type DrizzleDb } from '../db/client'

export interface CounterStats {
  publishedBrands: number
  publishedModels: number
  publishedVariants: number
  variantsWithOwnPage: number
}

/**
 * Пересчитывает счётчики товаров и решает, что публиковать.
 *
 * Два правила из спецификации:
 * 1. Пустые ветки не публикуются — марки, модели и кузова без товаров
 *    не должны попадать в sitemap, иначе Яндекс увидит малополезные страницы.
 * 2. Если у модели ровно один непустой кузов, отдельная страница кузова
 *    не создаётся: она дублировала бы страницу модели.
 *
 * Порядок запросов важен: счётчики моделей опираются на уже проставленный
 * флаг публикации кузовов, а решение о собственной странице кузова — на то,
 * сколько у его модели публикуемых кузовов.
 *
 * Функция пригодна для повторного вызова на уже заполненной базе, а не только
 * сразу после импорта. Поэтому она сначала сбрасывает счётчики и флаги в ноль:
 * запросы вида UPDATE ... FROM (SELECT ... GROUP BY ...) трогают лишь строки,
 * попавшие в подзапрос, а кузов, потерявший последнюю связку, туда не попадёт
 * и остался бы опубликованным со старым счётчиком. Проверка целостности этого
 * не поймает — счётчик и флаг протухнут согласованно.
 */
export async function recalculateCounters(db: DrizzleDb): Promise<CounterStats> {
  // Сброс перед пересчётом: см. пояснение выше
  await db.execute(sql`
    UPDATE variants SET product_count = 0, is_published = FALSE, has_own_page = FALSE
  `)
  await db.execute(sql`
    UPDATE models SET product_count = 0, variant_count = 0, is_published = FALSE
  `)
  await db.execute(sql`
    UPDATE brands SET product_count = 0, model_count = 0, is_published = FALSE
  `)

  // Товары на кузов
  await db.execute(sql`
    UPDATE variants v
    SET product_count = COALESCE(c.cnt, 0),
        is_published  = COALESCE(c.cnt, 0) > 0
    FROM (
      SELECT variant_id, COUNT(DISTINCT product_id) AS cnt
      FROM fitments GROUP BY variant_id
    ) c
    WHERE c.variant_id = v.id
  `)

  // Товары на модель. Кузова уже размечены выше, поэтому variant_count
  // считает только те, что действительно попадут на сайт.
  await db.execute(sql`
    UPDATE models m
    SET product_count = COALESCE(c.cnt, 0),
        variant_count = COALESCE(c.vcnt, 0),
        is_published  = COALESCE(c.cnt, 0) > 0
    FROM (
      SELECT v.model_id,
             COUNT(DISTINCT f.product_id) AS cnt,
             COUNT(DISTINCT v.id) FILTER (WHERE v.is_published) AS vcnt
      FROM variants v
      JOIN fitments f ON f.variant_id = v.id
      GROUP BY v.model_id
    ) c
    WHERE c.model_id = m.id
  `)

  // Товары на марку
  await db.execute(sql`
    UPDATE brands b
    SET product_count = COALESCE(c.cnt, 0),
        model_count   = COALESCE(c.mcnt, 0),
        is_published  = COALESCE(c.cnt, 0) > 0
    FROM (
      SELECT m.brand_id,
             COUNT(DISTINCT f.product_id) AS cnt,
             COUNT(DISTINCT m.id) AS mcnt
      FROM models m
      JOIN variants v ON v.model_id = m.id
      JOIN fitments f ON f.variant_id = v.id
      GROUP BY m.brand_id
    ) c
    WHERE c.brand_id = b.id
  `)

  // Своя страница — только у кузовов тех моделей, где публикуемых кузовов
  // больше одного. При единственном кузове страница модели показывает его сама.
  await db.execute(sql`
    UPDATE variants v
    SET has_own_page = TRUE
    WHERE v.is_published
      AND (
        SELECT COUNT(*) FROM variants x
        WHERE x.model_id = v.model_id AND x.is_published
      ) > 1
  `)

  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM brands   WHERE is_published) AS brands,
      (SELECT COUNT(*) FROM models   WHERE is_published) AS models,
      (SELECT COUNT(*) FROM variants WHERE is_published) AS variants,
      (SELECT COUNT(*) FROM variants WHERE has_own_page) AS own_pages
  `)

  const [row] = rowsOf<{
    brands: number | string
    models: number | string
    variants: number | string
    own_pages: number | string
  }>(result)

  if (!row) throw new Error('Запрос счётчиков не вернул ни одной строки')

  return {
    publishedBrands: Number(row.brands),
    publishedModels: Number(row.models),
    publishedVariants: Number(row.variants),
    variantsWithOwnPage: Number(row.own_pages),
  }
}
