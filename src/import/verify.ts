import { sql } from 'drizzle-orm'
import { rowsOf, type DrizzleDb } from '../db/client'

export interface IntegrityProblem {
  check: string
  count: number
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
        AS "Опубликованные кузова без товаров",
      (SELECT COUNT(*) FROM variants WHERE NOT is_published AND product_count > 0)
        AS "Скрытые кузова, у которых есть товары",
      (SELECT COUNT(*) FROM variants WHERE has_own_page AND NOT is_published)
        AS "Кузова со своей страницей, но не опубликованные",
      (SELECT COUNT(*) FROM brands WHERE is_published AND product_count = 0)
        AS "Опубликованные марки без товаров",
      (SELECT COUNT(*) FROM models WHERE is_published AND product_count = 0)
        AS "Опубликованные модели без товаров",
      (SELECT COUNT(*) FROM fitments f LEFT JOIN products p ON p.id = f.product_id WHERE p.id IS NULL)
        AS "Связки, ссылающиеся на несуществующий товар",
      (SELECT COUNT(*) FROM fitments f LEFT JOIN variants v ON v.id = f.variant_id WHERE v.id IS NULL)
        AS "Связки, ссылающиеся на несуществующий кузов",
      (SELECT COUNT(*) FROM products WHERE slug IS NULL OR slug = '')
        AS "Товары без слага",
      (SELECT COUNT(*) FROM variants WHERE slug IS NULL OR slug = '')
        AS "Кузова без слага"
  `)

  const [row] = rowsOf<Record<string, number | string>>(result)
  if (!row) throw new Error('Проверка целостности не вернула результата')

  return Object.entries(row)
    .map(([check, value]) => ({ check, count: Number(value) }))
    .filter((problem) => problem.count > 0)
}
