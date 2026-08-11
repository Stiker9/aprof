import { sql } from 'drizzle-orm'
import { rowsOf, type DrizzleDb } from '../db/client'

export interface IntegrityProblem {
  check: string
  count: number
}

/**
 * Человекочитаемые описания проверок.
 *
 * Ключи запроса — латиницей и короткие намеренно: PostgreSQL обрезает
 * имена столбцов до 63 байт, а кириллица в UTF-8 занимает два байта
 * на символ. Русские псевдонимы длиннее 31 символа молча обрезались бы,
 * а два похожих могли обрезаться в один и тот же — тогда одна из проверок
 * бесследно исчезла бы из результата.
 */
const DESCRIPTIONS: Record<string, string> = {
  published_variants_no_products: 'Опубликованные кузова без товаров',
  hidden_variants_with_products: 'Скрытые кузова, у которых есть товары',
  own_page_not_published: 'Кузова со своей страницей, но не опубликованные',
  published_brands_no_products: 'Опубликованные марки без товаров',
  published_models_no_products: 'Опубликованные модели без товаров',
  products_without_fitments: 'Товары, не привязанные ни к одному кузову',
  variant_counter_mismatch: 'Кузова, у которых счётчик разошёлся со связками',
  products_without_slug: 'Товары без слага',
  variants_without_slug: 'Кузова без слага',
}

/**
 * Проверяет согласованность данных после импорта и пересчёта счётчиков.
 *
 * Счётчики и флаги публикации денормализованы: они хранятся в колонках,
 * а не вычисляются на лету. Значит, они могут разойтись с реальными
 * связями — и разойдутся молча. Эта проверка ловит расхождение сразу,
 * а не когда на сайте появится марка без единого товара.
 *
 * Возвращает список нарушений. Пустой список означает, что данные целы.
 */
export async function verifyIntegrity(db: DrizzleDb): Promise<IntegrityProblem[]> {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM variants WHERE is_published AND product_count = 0)
        AS published_variants_no_products,
      (SELECT COUNT(*) FROM variants WHERE NOT is_published AND product_count > 0)
        AS hidden_variants_with_products,
      (SELECT COUNT(*) FROM variants WHERE has_own_page AND NOT is_published)
        AS own_page_not_published,
      (SELECT COUNT(*) FROM brands WHERE is_published AND product_count = 0)
        AS published_brands_no_products,
      (SELECT COUNT(*) FROM models WHERE is_published AND product_count = 0)
        AS published_models_no_products,
      (SELECT COUNT(*) FROM products p
        WHERE NOT EXISTS (SELECT 1 FROM fitments f WHERE f.product_id = p.id))
        AS products_without_fitments,
      (SELECT COUNT(*) FROM variants v
        WHERE v.product_count <> (
          SELECT COUNT(DISTINCT f.product_id) FROM fitments f WHERE f.variant_id = v.id
        ))
        AS variant_counter_mismatch,
      (SELECT COUNT(*) FROM products WHERE slug IS NULL OR slug = '')
        AS products_without_slug,
      (SELECT COUNT(*) FROM variants WHERE slug IS NULL OR slug = '')
        AS variants_without_slug
  `)

  const [row] = rowsOf<Record<string, number | string>>(result)
  if (!row) throw new Error('Проверка целостности не вернула результата')

  const keys = Object.keys(row)
  const missing = Object.keys(DESCRIPTIONS).filter((k) => !keys.includes(k))
  if (missing.length > 0) {
    throw new Error(`Запрос целостности не вернул проверки: ${missing.join(', ')}`)
  }

  return keys
    .map((key) => ({ check: DESCRIPTIONS[key] ?? key, count: Number(row[key]) }))
    .filter((problem) => problem.count > 0)
}
