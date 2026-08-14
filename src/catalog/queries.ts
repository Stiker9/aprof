import { and, asc, eq } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { brands, fitments, manufacturers, models, products, variants } from '../db/schema'

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
