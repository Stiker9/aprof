import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Требуется ли вырез бампера. unknown — данных в источнике нет. */
export const bumperCutEnum = pgEnum('bumper_cut', ['not_required', 'required', 'unknown'])

/** Производители фаркопов: Steinhof, GALIA, Oris и т.д. */
export const manufacturers = pgTable('manufacturers', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  country: text('country'),
})

/** Марки автомобилей */
export const brands = pgTable(
  'brands',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    modelCount: integer('model_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
  },
  (t) => [index('brands_published_idx').on(t.isPublished)],
)

/** Модели автомобилей */
export const models = pgTable(
  'models',
  {
    id: serial('id').primaryKey(),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    variantCount: integer('variant_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
  },
  (t) => [uniqueIndex('models_brand_slug_idx').on(t.brandId, t.slug)],
)

/**
 * Кузова (поколения). hasOwnPage=false означает, что у модели это
 * единственный кузов и отдельная страница для него не создаётся —
 * иначе она дублировала бы страницу модели.
 */
export const variants = pgTable(
  'variants',
  {
    id: serial('id').primaryKey(),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    slug: text('slug').notNull(),
    /** Очищенное название из источника, кириллицей: «Тойота РАВ4 XA10 1995-2000» */
    name: text('name').notNull(),
    /**
     * Код поколения латиницей: XA10, E120, F15.
     * null, когда в источнике его нет (Giulia, ZDX, 147).
     * На страницах подпись собирается как
     * `${brand.name} ${model.name} ${generation ?? ''} ${годы}` —
     * иначе рядом с латинским «Toyota» встанет кириллическое «Тойота РАВ4».
     */
    generation: text('generation'),
    yearFrom: integer('year_from'),
    yearTo: integer('year_to'),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    hasOwnPage: boolean('has_own_page').notNull().default(false),
  },
  (t) => [uniqueIndex('variants_model_slug_idx').on(t.modelId, t.slug)],
)

/** Товары-фаркопы */
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    article: text('article').notNull(),
    manufacturerId: integer('manufacturer_id')
      .notNull()
      .references(() => manufacturers.id),
    description: text('description').notNull(),
    /** Цена из источника (фаркоп.рф). Розничная цена считается отдельно. */
    sourcePrice: integer('source_price').notNull(),
    deliveryText: text('delivery_text'),
    inStock: boolean('in_stock').notNull().default(false),
    ballType: text('ball_type'),
    towLoadKg: integer('tow_load_kg'),
    verticalLoadKg: integer('vertical_load_kg'),
    weightKg: real('weight_kg'),
    bumperCut: bumperCutEnum('bumper_cut').notNull().default('unknown'),
    /** null означает, что данных в источнике нет */
    electricsIncluded: boolean('electrics_included'),
    sourceUrl: text('source_url'),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    documents: jsonb('documents').$type<{ url: string; label: string }[]>().notNull().default([]),
  },
  (t) => [index('products_manufacturer_idx').on(t.manufacturerId)],
)

/** Связка «этот фаркоп подходит к этому кузову» */
export const fitments = pgTable(
  'fitments',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    variantId: integer('variant_id')
      .notNull()
      .references(() => variants.id),
    price: integer('price'),
    deliveryText: text('delivery_text'),
  },
  (t) => [
    uniqueIndex('fitments_product_variant_idx').on(t.productId, t.variantId),
    index('fitments_variant_idx').on(t.variantId),
  ],
)

export type Manufacturer = typeof manufacturers.$inferSelect
export type Brand = typeof brands.$inferSelect
export type Model = typeof models.$inferSelect
export type Variant = typeof variants.$inferSelect
export type Product = typeof products.$inferSelect
export type Fitment = typeof fitments.$inferSelect
