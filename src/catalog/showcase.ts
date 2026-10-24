import { eq } from 'drizzle-orm'
import type { DrizzleDb } from '@/db/client'
import { brands, fitments, models, products, variants } from '@/db/schema'
import { formatNumber, formatPrice } from '@/catalog/format'
import { listAllProductsCompact } from '@/catalog/queries'
import { productPhotoSrc } from '@/catalog/product-photos'

/**
 * Четыре товара для витрины на главной.
 *
 * Своими средствами каталога не обойтись: там есть списки по марке,
 * модели и кузову, а тут нужен «просто хороший срез склада». Поэтому
 * берём уже собранный компактный список (он же кормит страницу подбора),
 * фильтруем по наличию и своей картинке и разводим по производителям —
 * иначе первые четыре дешёвые позиции окажутся одного завода.
 *
 * Цены и скрытые владельцем товары приходят уже с правками: список
 * собирается через тот же applyToList, что и каталог, — значит на главной
 * не появится цена, которой нет в карточке.
 *
 * Картинки у товаров — в основном схемы сборки с сайтов заводов, а не
 * фотографии. Поэтому на витрине они маленькие: в строке 56×42 схема
 * читается как значок, а в большой карточке выглядела бы технической
 * документацией.
 */
export interface ShowcaseItem {
  slug: string
  article: string
  manufacturer: string
  price: string
  photo: string
  /** «Подходит на … · шар A · до 1 200 кг» — характеристики под названием. */
  note: string
}

export async function listInStockShowcase(db: DrizzleDb, limit = 4): Promise<ShowcaseItem[]> {
  const all = await listAllProductsCompact(db)

  const picked: typeof all = []
  const manufacturers = new Set<string>()

  for (const row of all) {
    const manufacturer = row[2]
    const inStock = row[4]
    const hasPhoto = row[10]

    if (inStock !== 1 || !hasPhoto) continue
    if (manufacturers.has(manufacturer)) continue

    manufacturers.add(manufacturer)
    picked.push(row)
    if (picked.length === limit) break
  }

  return Promise.all(
    picked.map(async (row) => {
      const [slug, article, manufacturer, price] = row

      const [fitment] = await db
        .select({ brand: brands.name, model: models.name })
        .from(fitments)
        .innerJoin(variants, eq(variants.id, fitments.variantId))
        .innerJoin(models, eq(models.id, variants.modelId))
        .innerJoin(brands, eq(brands.id, models.brandId))
        .innerJoin(products, eq(products.id, fitments.productId))
        .where(eq(products.slug, slug))
        .limit(1)

      const ballType = row[6]
      const towLoadKg = row[7]

      const parts: string[] = []
      if (fitment) parts.push(`${fitment.brand} ${fitment.model}`)
      if (ballType && ['A', 'C', 'F'].includes(ballType)) parts.push(`шар ${ballType}`)
      if (towLoadKg) parts.push(`${formatNumber(towLoadKg)} кг`)

      return {
        slug,
        article,
        manufacturer,
        price: formatPrice(price),
        photo: typeof row[10] === 'string' ? row[10] : (productPhotoSrc(slug) ?? ''),
        note: parts.join(' · '),
      }
    }),
  )
}
