import type { DrizzleDb } from '../db/client'
import { brands, fitments, manufacturers, models, products, variants } from '../db/schema'
import { dedupeFitments, dedupeVariants } from './dedupe'
import { extractCatalog } from './extract'
import {
  cleanVariantName,
  normalizeManufacturer,
  parseGeneration,
  parseYears,
  slugify,
  slugifyArticle,
} from './normalize'

export interface ImportStats {
  manufacturers: number
  brands: number
  models: number
  variants: number
  products: number
  fitments: number
}

/** Признак наличия на складе: «сегодня» означает отгрузку сразу. */
const isInStock = (deliveryShort: string | null): boolean =>
  (deliveryShort ?? '').toLowerCase().includes('сегодня')

/**
 * Сколько строк вставляем за один запрос.
 *
 * PostgreSQL допускает не больше 65 535 подстановок в одном запросе.
 * У товаров 16 подставляемых колонок, поэтому одной вставкой 5 808 строк
 * не пройти: получается 92 928 подстановок, и запрос падает.
 * 500 строк дают запас по любой из таблиц.
 */
const CHUNK_SIZE = 500

/**
 * Вставляет строки порциями и собирает возвращённые записи.
 *
 * Порядок сохраняется: порции идут последовательно, а внутри порции
 * PostgreSQL возвращает строки в порядке вставки. Это важно — дальше
 * по позиции в массиве строятся карты соответствия индексов.
 */
async function insertAll<TValues, TRow>(
  values: TValues[],
  insertChunk: (chunk: TValues[]) => Promise<TRow[]>,
): Promise<TRow[]> {
  const rows: TRow[] = []
  for (let offset = 0; offset < values.length; offset += CHUNK_SIZE) {
    rows.push(...(await insertChunk(values.slice(offset, offset + CHUNK_SIZE))))
  }
  return rows
}

/**
 * Разворачивает исходный каталог в БД.
 *
 * Порядок вставки продиктован внешними ключами:
 * производители → марки → модели → кузова → товары → связки.
 *
 * Дубли схлопываются до вставки, а не после: в схеме стоят уникальные
 * индексы на пару (модель, слаг) у кузовов и на пару (товар, кузов)
 * у связок, поэтому попытка вставить дубль просто уронила бы импорт.
 */
export async function importCatalog(html: string, db: DrizzleDb): Promise<ImportStats> {
  const raw = extractCatalog(html)

  // --- производители ---
  // Страну берём из первого встреченного товара этого производителя:
  // в источнике она указана у товара, а не у производителя.
  const countryByName = new Map<string, string | null>()
  for (const p of raw.products) {
    const name = normalizeManufacturer(p.manufacturerRaw)
    if (!countryByName.has(name)) countryByName.set(name, p.country)
  }

  const manufacturerRows = await insertAll(
    [...countryByName.entries()].map(([name, country]) => ({
      slug: slugify(name),
      name,
      country,
    })),
    (chunk) => db.insert(manufacturers).values(chunk).returning(),
  )

  const manufacturerIdByName = new Map(manufacturerRows.map((m) => [m.name, m.id]))

  // --- марки ---
  const brandRows = await insertAll(
    raw.brands.map((b) => ({
      slug: slugify(b.name),
      name: b.name,
      sourceUrl: b.sourceUrl,
    })),
    (chunk) => db.insert(brands).values(chunk).returning(),
  )

  const brandIdByIndex = new Map(brandRows.map((b, i) => [i, b.id]))

  // --- модели ---
  const modelRows = await insertAll(
    raw.models.map((m) => ({
      brandId: brandIdByIndex.get(m.brandIndex)!,
      slug: slugify(m.name),
      name: m.name,
      sourceUrl: m.sourceUrl,
    })),
    (chunk) => db.insert(models).values(chunk).returning(),
  )

  const modelIdByIndex = new Map(modelRows.map((m, i) => [i, m.id]))

  // --- кузова ---
  // Схлопываем дубли и запоминаем карту, чтобы перевести на неё связки.
  const { kept: uniqueVariants, indexMap: variantIndexMap } = dedupeVariants(raw.variants)

  const variantRows = await insertAll(
    uniqueVariants.map((v) => {
      const name = cleanVariantName(v.name)
      const years = parseYears(name)
      const modelName = raw.models[v.modelIndex].name
      return {
        modelId: modelIdByIndex.get(v.modelIndex)!,
        slug: slugify(name),
        name,
        generation: parseGeneration(name, modelName),
        yearFrom: years.from,
        yearTo: years.to,
        sourceUrl: v.sourceUrl,
      }
    }),
    (chunk) => db.insert(variants).values(chunk).returning(),
  )

  const variantIdByIndex = new Map(variantRows.map((v, i) => [i, v.id]))

  // --- товары ---
  const productRows = await insertAll(
    raw.products.map((p) => ({
      slug: slugifyArticle(p.article),
      article: p.article,
      manufacturerId: manufacturerIdByName.get(normalizeManufacturer(p.manufacturerRaw))!,
      description: p.description,
      sourcePrice: p.price,
      deliveryText: p.deliveryText,
      inStock: isInStock(p.deliveryShort),
      ballType: p.ballType,
      towLoadKg: p.towLoadKg,
      verticalLoadKg: p.verticalLoadKg,
      weightKg: p.weightKg,
      bumperCut: p.bumperCut,
      electricsIncluded: p.electricsIncluded,
      sourceUrl: p.sourceUrl,
      images: p.images,
      documents: p.documents,
    })),
    (chunk) => db.insert(products).values(chunk).returning(),
  )

  const productIdByIndex = new Map(productRows.map((p, i) => [i, p.id]))

  // --- связки ---
  // Сначала переводим на новые индексы кузовов, потом схлопываем:
  // после схлопывания дубля кузова часть связок становится одинаковой.
  const remapped = raw.fitments.map((f) => ({
    ...f,
    variantIndex: variantIndexMap.get(f.variantIndex)!,
  }))

  const fitmentRows = await insertAll(
    dedupeFitments(remapped).map((f) => ({
      productId: productIdByIndex.get(f.productIndex)!,
      variantId: variantIdByIndex.get(f.variantIndex)!,
      price: f.price,
      deliveryText: f.deliveryShort,
    })),
    (chunk) => db.insert(fitments).values(chunk).returning(),
  )

  return {
    manufacturers: manufacturerRows.length,
    brands: brandRows.length,
    models: modelRows.length,
    variants: variantRows.length,
    products: productRows.length,
    fitments: fitmentRows.length,
  }
}
