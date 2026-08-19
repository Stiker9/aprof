import { and, asc, eq, ne } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { brands, fitments, manufacturers, models, products, variants } from '../db/schema'
import { formatVariantShort } from './format'

export interface BrandRow {
  slug: string
  name: string
  productCount: number
  modelCount: number
}

export interface ModelRow {
  slug: string
  name: string
  productCount: number
  variantCount: number
}

export interface VariantRow {
  slug: string
  name: string
  generation: string | null
  yearFrom: number | null
  yearTo: number | null
  productCount: number
  hasOwnPage: boolean
}

export interface ProductRow {
  slug: string
  article: string
  manufacturer: string
  country: string | null
  price: number
  inStock: boolean
  deliveryText: string | null
  ballType: string | null
  towLoadKg: number | null
  verticalLoadKg: number | null
  weightKg: number | null
  bumperCut: 'not_required' | 'required' | 'unknown'
  electricsIncluded: boolean | null
  description: string
  images: string[]
  documents: { url: string; label: string }[]
}

/** Марки с товарами, по алфавиту. Пустые не публикуются. */
export async function listBrands(db: DrizzleDb): Promise<BrandRow[]> {
  return db
    .select({
      slug: brands.slug,
      name: brands.name,
      productCount: brands.productCount,
      modelCount: brands.modelCount,
    })
    .from(brands)
    .where(eq(brands.isPublished, true))
    .orderBy(asc(brands.name))
}

export async function getBrand(db: DrizzleDb, slug: string): Promise<BrandRow | null> {
  const [row] = await db
    .select({
      slug: brands.slug,
      name: brands.name,
      productCount: brands.productCount,
      modelCount: brands.modelCount,
    })
    .from(brands)
    .where(and(eq(brands.slug, slug), eq(brands.isPublished, true)))
    .limit(1)
  return row ?? null
}

export async function listModels(db: DrizzleDb, brandSlug: string): Promise<ModelRow[]> {
  return db
    .select({
      slug: models.slug,
      name: models.name,
      productCount: models.productCount,
      variantCount: models.variantCount,
    })
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(and(eq(brands.slug, brandSlug), eq(models.isPublished, true)))
    .orderBy(asc(models.name))
}

export async function getModel(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug: string,
): Promise<ModelRow | null> {
  const [row] = await db
    .select({
      slug: models.slug,
      name: models.name,
      productCount: models.productCount,
      variantCount: models.variantCount,
    })
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      and(eq(brands.slug, brandSlug), eq(models.slug, modelSlug), eq(models.isPublished, true)),
    )
    .limit(1)
  return row ?? null
}

export async function listVariants(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug: string,
): Promise<VariantRow[]> {
  return db
    .select({
      slug: variants.slug,
      name: variants.name,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      productCount: variants.productCount,
      hasOwnPage: variants.hasOwnPage,
    })
    .from(variants)
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      and(
        eq(brands.slug, brandSlug),
        eq(models.slug, modelSlug),
        eq(variants.isPublished, true),
      ),
    )
    .orderBy(asc(variants.yearFrom))
}

export async function getVariant(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug: string,
  variantSlug: string,
): Promise<VariantRow | null> {
  const all = await listVariants(db, brandSlug, modelSlug)
  return all.find((v) => v.slug === variantSlug) ?? null
}

/** Товары, подходящие к кузову. Дешёвые первыми — так их и сравнивают. */
export async function listProductsForVariant(
  db: DrizzleDb,
  variantSlug: string,
  brandSlug: string,
  modelSlug: string,
): Promise<ProductRow[]> {
  return db
    .select({
      slug: products.slug,
      article: products.article,
      manufacturer: manufacturers.name,
      country: manufacturers.country,
      price: products.sourcePrice,
      inStock: products.inStock,
      deliveryText: products.deliveryText,
      ballType: products.ballType,
      towLoadKg: products.towLoadKg,
      verticalLoadKg: products.verticalLoadKg,
      weightKg: products.weightKg,
      bumperCut: products.bumperCut,
      electricsIncluded: products.electricsIncluded,
      description: products.description,
      images: products.images,
      documents: products.documents,
    })
    .from(products)
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .innerJoin(fitments, eq(fitments.productId, products.id))
    .innerJoin(variants, eq(variants.id, fitments.variantId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      and(
        eq(brands.slug, brandSlug),
        eq(models.slug, modelSlug),
        eq(variants.slug, variantSlug),
      ),
    )
    .orderBy(asc(products.sourcePrice))
}

export async function getProduct(db: DrizzleDb, articleSlug: string): Promise<ProductRow | null> {
  const [row] = await db
    .select({
      slug: products.slug,
      article: products.article,
      manufacturer: manufacturers.name,
      country: manufacturers.country,
      price: products.sourcePrice,
      inStock: products.inStock,
      deliveryText: products.deliveryText,
      ballType: products.ballType,
      towLoadKg: products.towLoadKg,
      verticalLoadKg: products.verticalLoadKg,
      weightKg: products.weightKg,
      bumperCut: products.bumperCut,
      electricsIncluded: products.electricsIncluded,
      description: products.description,
      images: products.images,
      documents: products.documents,
    })
    .from(products)
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(eq(products.slug, articleSlug))
    .limit(1)
  return row ?? null
}

/** Машины, к которым подходит товар. Ключевой узел перелинковки. */
export async function listVariantsForProduct(
  db: DrizzleDb,
  articleSlug: string,
): Promise<
  { brand: string; brandSlug: string; model: string; modelSlug: string; variant: VariantRow }[]
> {
  const rows = await db
    .select({
      brand: brands.name,
      brandSlug: brands.slug,
      model: models.name,
      modelSlug: models.slug,
      slug: variants.slug,
      name: variants.name,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      productCount: variants.productCount,
      hasOwnPage: variants.hasOwnPage,
    })
    .from(variants)
    .innerJoin(fitments, eq(fitments.variantId, variants.id))
    .innerJoin(products, eq(products.id, fitments.productId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(and(eq(products.slug, articleSlug), eq(variants.isPublished, true)))
    .orderBy(asc(brands.name), asc(models.name), asc(variants.yearFrom))

  return rows.map((r) => ({
    brand: r.brand,
    brandSlug: r.brandSlug,
    model: r.model,
    modelSlug: r.modelSlug,
    variant: {
      slug: r.slug,
      name: r.name,
      generation: r.generation,
      yearFrom: r.yearFrom,
      yearTo: r.yearTo,
      productCount: r.productCount,
      hasOwnPage: r.hasOwnPage,
    },
  }))
}

/** Пути всех кузовов со своей страницей — для generateStaticParams. */
export async function listAllVariantPaths(
  db: DrizzleDb,
): Promise<{ brand: string; model: string; variant: string }[]> {
  return db
    .select({ brand: brands.slug, model: models.slug, variant: variants.slug })
    .from(variants)
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(eq(variants.hasOwnPage, true))
}

export async function listAllProductSlugs(db: DrizzleDb): Promise<string[]> {
  const rows = await db.select({ slug: products.slug }).from(products)
  return rows.map((r) => r.slug)
}

/**
 * Сколько всего товаров в каталоге.
 *
 * Считать сложением счётчиков по маркам нельзя: один фаркоп подходит
 * к машинам разных марок и попал бы в сумму несколько раз. На главной
 * это давало 7 339 вместо 5 808.
 */
export async function countProducts(db: DrizzleDb): Promise<number> {
  const rows = await db.select({ id: products.id }).from(products)
  return rows.length
}

/**
 * Одна строка справочника подбора.
 *
 * Ключи однобуквенные: `s` — адрес, `n` — название, `c` — сколько
 * фаркопов, дальше вложенный список. Справочник уезжает в браузер
 * целиком, и с обычными именами полей он весит вчетверо больше.
 */
export interface PickerBrand {
  s: string
  n: string
  c: number
  m: PickerModel[]
}

export interface PickerModel {
  s: string
  n: string
  c: number
  v: PickerVariant[]
}

export interface PickerVariant {
  s: string
  n: string
  c: number
  /** Есть ли у кузова своя страница. Если нет — вести на страницу модели. */
  p: boolean
}

/**
 * Справочник для подбора: все марки, модели и кузова одним деревом.
 *
 * Уезжает в браузер целиком, поэтому ключи однобуквенные, а лишних
 * полей нет: 106 марок, 956 моделей и 1 949 кузовов при обычных именах
 * полей весят вчетверо больше, а грузится это ради трёх выпадающих
 * списков.
 *
 * Собирается одним проходом по трём таблицам, а не запросом на каждую
 * марку: иначе 106 запросов на сборке.
 */
export async function buildPickerIndex(db: DrizzleDb): Promise<PickerBrand[]> {
  const rows = await db
    .select({
      brandSlug: brands.slug,
      brandName: brands.name,
      brandCount: brands.productCount,
      modelSlug: models.slug,
      modelName: models.name,
      modelCount: models.productCount,
      variantSlug: variants.slug,
      variantGeneration: variants.generation,
      variantFrom: variants.yearFrom,
      variantTo: variants.yearTo,
      variantCount: variants.productCount,
      variantHasPage: variants.hasOwnPage,
    })
    .from(variants)
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(and(eq(brands.isPublished, true), eq(models.isPublished, true)))
    .orderBy(asc(brands.name), asc(models.name), asc(variants.yearFrom))

  const byBrand = new Map<string, PickerBrand>()
  const byModel = new Map<string, PickerModel>()

  for (const row of rows) {
    let brand = byBrand.get(row.brandSlug)
    if (!brand) {
      brand = { s: row.brandSlug, n: row.brandName, c: row.brandCount, m: [] }
      byBrand.set(row.brandSlug, brand)
    }

    const modelKey = `${row.brandSlug}/${row.modelSlug}`
    let model = byModel.get(modelKey)
    if (!model) {
      model = { s: row.modelSlug, n: row.modelName, c: row.modelCount, v: [] }
      byModel.set(modelKey, model)
      brand.m.push(model)
    }

    model.v.push({
      s: row.variantSlug,
      n:
        formatVariantShort(row.variantGeneration, row.variantFrom, row.variantTo) || row.modelName,
      c: row.variantCount,
      p: row.variantHasPage,
    })
  }

  return [...byBrand.values()]
}

/**
 * Похожие товары — те, что подходят к той же машине.
 *
 * «Похожесть» тут не про характеристики, а про задачу: человек смотрит
 * фаркоп на свой кузов, и полезно ему то, что встанет туда же. Подбирать
 * по нагрузке или производителю бессмысленно — деталь с другой машины
 * ему не подойдёт, какой бы близкой по цифрам ни была.
 *
 * Сам товар из выдачи исключается, иначе он стоял бы в списке
 * «похожих» на самого себя.
 */
export async function listSimilarProducts(
  db: DrizzleDb,
  articleSlug: string,
  limit = 4,
): Promise<ProductRow[]> {
  const [own] = await db
    .select({ variantId: fitments.variantId })
    .from(fitments)
    .innerJoin(products, eq(products.id, fitments.productId))
    .where(eq(products.slug, articleSlug))
    .limit(1)

  if (!own) return []

  const rows = await db
    .select({
      slug: products.slug,
      article: products.article,
      manufacturer: manufacturers.name,
      country: manufacturers.country,
      price: products.sourcePrice,
      inStock: products.inStock,
      deliveryText: products.deliveryText,
      images: products.images,
    })
    .from(products)
    .innerJoin(fitments, eq(fitments.productId, products.id))
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(and(eq(fitments.variantId, own.variantId), ne(products.slug, articleSlug)))
    .orderBy(asc(products.sourcePrice))
    .limit(limit)

  return rows.map((r) => ({
    slug: r.slug,
    article: r.article,
    manufacturer: r.manufacturer,
    country: r.country,
    price: r.price,
    inStock: r.inStock,
    deliveryText: r.deliveryText,
    ballType: null,
    towLoadKg: null,
    verticalLoadKg: null,
    weightKg: null,
    bumperCut: 'unknown',
    electricsIncluded: null,
    description: '',
    images: r.images,
    documents: [],
  }))
}

/**
 * Доля фаркопов, которые ставятся без выреза бампера.
 *
 * Считается по базе, а не берётся из макета. Там стояло «84%» — число,
 * взятое с потолка, а это обещание покупателю: он читает его до записи
 * и приезжает, рассчитывая, что бампер резать не будут.
 *
 * Позиции без данных о вырезе в расчёт не идут — иначе они молча
 * ухудшали бы долю, хотя про них попросту ничего не известно.
 */
export async function shareWithoutBumperCut(db: DrizzleDb): Promise<number | null> {
  const rows = await db.select({ bumperCut: products.bumperCut }).from(products)
  const known = rows.filter((row) => row.bumperCut !== 'unknown')
  if (known.length === 0) return null

  const free = known.filter((row) => row.bumperCut === 'not_required').length
  return Math.round((free / known.length) * 100)
}

/**
 * Самая низкая цена в каталоге — для строки «цены от …».
 *
 * Считается по базе, а не задаётся числом: цены приходят из источника
 * и меняются при каждом обновлении каталога. Записанная руками цифра
 * разошлась бы с карточками товаров уже на первом импорте.
 */
export async function minProductPrice(db: DrizzleDb): Promise<number> {
  const rows = await db.select({ price: products.sourcePrice }).from(products)
  if (rows.length === 0) {
    throw new Error('В каталоге нет товаров — не от чего считать минимальную цену')
  }
  return rows.reduce((min, row) => (row.price < min ? row.price : min), rows[0].price)
}
