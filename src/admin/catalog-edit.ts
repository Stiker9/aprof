import { and, asc, count, eq, inArray } from 'drizzle-orm'
import type { DrizzleDb } from '@/db/client'
import { brands, fitments, manufacturers, models, products, variants } from '@/db/schema'
import { slugify as strictSlugify, slugifyArticle as strictArticleSlug } from '@/import/normalize'
import { recalculateCounters } from '@/import/counters'

/**
 * Правка каталога владельцем: машины, свои фаркопы, совместимость.
 *
 * ── Почему в тех же таблицах, что выгрузка ──
 *
 * Каталог, фильтры, подбор и карта сайта читают brands, models, variants,
 * products и fitments. Положи добавленное владельцем в отдельные таблицы
 * — и каждое из этих мест пришлось бы учить читать два источника. Здесь
 * всё ложится туда же, с пометкой added_by_owner, и сайт видит новую
 * машину или фаркоп так же, как пришедшие от поставщика.
 *
 * Выгрузка поставщика была один раз, в августе 2026: регулярной нет, и
 * затирать добавленное некому. Если её когда-нибудь вернут, импорт
 * обязан сохранять строки с пометкой.
 *
 * ── Счётчики ──
 *
 * После каждой правки — recalculateCounters: от числа товаров зависит,
 * публикуется ли машина и есть ли у кузова своя страница. Машина без
 * единого фаркопа на сайт не выходит — пустая страница хуже, чем никакой.
 */

export class CatalogEditError extends Error {}

/*
  Те же правила адресов, что при загрузке каталога, — новая машина и
  новый артикул выглядят в адресах так же, как пришедшие от поставщика.
  Только пустой результат здесь не ошибка программы, а неудачный ввод:
  возвращаем пустую строку, и вызывающий говорит владельцу, что не так.
*/
function slugify(input: string): string {
  try {
    return strictSlugify(input)
  } catch {
    return ''
  }
}

function slugifyArticle(article: string): string {
  try {
    return strictArticleSlug(article)
  } catch {
    return ''
  }
}

/* ── Совместимость ──────────────────────────────────────────────── */

export interface FitRow {
  fitmentId: number
  variantId: number
  brand: string
  model: string
  generation: string | null
  yearFrom: number | null
  yearTo: number | null
  addedByOwner: boolean
}

export async function listFits(db: DrizzleDb, productSlug: string): Promise<FitRow[]> {
  return db
    .select({
      fitmentId: fitments.id,
      variantId: variants.id,
      brand: brands.name,
      model: models.name,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      addedByOwner: fitments.addedByOwner,
    })
    .from(fitments)
    .innerJoin(products, eq(products.id, fitments.productId))
    .innerJoin(variants, eq(variants.id, fitments.variantId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(eq(products.slug, productSlug))
    .orderBy(asc(brands.name), asc(models.name), asc(variants.yearFrom))
}

/** Совместимость для всех товаров страницы админки — одним запросом. */
export async function fitsFor(db: DrizzleDb, slugs: string[]): Promise<Record<string, FitRow[]>> {
  if (slugs.length === 0) return {}
  const rows = await db
    .select({
      slug: products.slug,
      fitmentId: fitments.id,
      variantId: variants.id,
      brand: brands.name,
      model: models.name,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      addedByOwner: fitments.addedByOwner,
    })
    .from(fitments)
    .innerJoin(products, eq(products.id, fitments.productId))
    .innerJoin(variants, eq(variants.id, fitments.variantId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(inArray(products.slug, slugs))
    .orderBy(asc(brands.name), asc(models.name), asc(variants.yearFrom))

  const result: Record<string, FitRow[]> = {}
  for (const { slug, ...fit } of rows) (result[slug] ??= []).push(fit)
  return result
}

export async function addFit(db: DrizzleDb, productSlug: string, variantId: number): Promise<void> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, productSlug))
  if (!product) throw new CatalogEditError('Товар не найден')

  await db
    .insert(fitments)
    .values({ productId: product.id, variantId, addedByOwner: true })
    .onConflictDoNothing()
  await recalculateCounters(db)
}

/** Возвращает слаг товара — его надо пометить к публикации. */
export async function removeFit(db: DrizzleDb, fitmentId: number): Promise<string | null> {
  const [row] = await db
    .select({ slug: products.slug, productId: products.id })
    .from(fitments)
    .innerJoin(products, eq(products.id, fitments.productId))
    .where(eq(fitments.id, fitmentId))
  if (!row) return null

  /*
    Последнюю машину у товара не убираем: товар без совместимости
    пропал бы из каталога, но остался бы в базе, и найти его можно было
    бы только по артикулу. Убрать товар с сайта — это «Скрыть».
  */
  const [left] = await db
    .select({ n: count() })
    .from(fitments)
    .where(eq(fitments.productId, row.productId))
  if (Number(left?.n ?? 0) <= 1) {
    throw new CatalogEditError('Это последняя машина у товара. Чтобы убрать товар с сайта, нажмите «Скрыть»')
  }

  await db.delete(fitments).where(eq(fitments.id, fitmentId))
  await recalculateCounters(db)
  return row.slug
}

/* ── Выбор машины: марка → модель → кузов ──────────────────────────── */

export interface CarOption {
  value: string
  label: string
  /** Сколько фаркопов — подсказка, что машина уже живая. */
  count: number
  addedByOwner: boolean
}

/**
 * Все марки, а не только опубликованные: новая марка, добавленная
 * владельцем, не опубликована, пока к ней не привязан фаркоп, — а
 * привязать его как раз и нужно здесь.
 */
export async function brandOptions(db: DrizzleDb): Promise<CarOption[]> {
  const rows = await db
    .select({
      value: brands.slug,
      label: brands.name,
      count: brands.productCount,
      addedByOwner: brands.addedByOwner,
    })
    .from(brands)
    .orderBy(asc(brands.name))
  return rows
}

export async function modelOptions(db: DrizzleDb, brandSlug: string): Promise<CarOption[]> {
  return db
    .select({
      value: models.slug,
      label: models.name,
      count: models.productCount,
      addedByOwner: models.addedByOwner,
    })
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(eq(brands.slug, brandSlug))
    .orderBy(asc(models.name))
}

export async function variantOptions(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug: string,
): Promise<(CarOption & { id: number })[]> {
  const rows = await db
    .select({
      id: variants.id,
      value: variants.slug,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      count: variants.productCount,
      addedByOwner: variants.addedByOwner,
    })
    .from(variants)
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(and(eq(brands.slug, brandSlug), eq(models.slug, modelSlug)))
    .orderBy(asc(variants.yearFrom))

  return rows.map((row) => ({
    id: row.id,
    value: row.value,
    label: variantLabel(row.generation, row.yearFrom, row.yearTo),
    count: row.count,
    addedByOwner: row.addedByOwner,
  }))
}

export function variantLabel(
  generation: string | null,
  yearFrom: number | null,
  yearTo: number | null,
): string {
  const years = yearFrom ? `${yearFrom}–${yearTo ?? 'н.в.'}` : ''
  return [generation, years].filter(Boolean).join(' ') || 'все годы'
}

/* ── Добавление машин ──────────────────────────────────────────────── */

function cleanName(value: string, what: string): string {
  const name = value.trim().replace(/\s+/g, ' ')
  if (!name) throw new CatalogEditError(`Укажите ${what}`)
  if (name.length > 60) throw new CatalogEditError(`Слишком длинное название (${what})`)
  return name
}

/** Марку по названию: есть такая — вернёт её, нет — добавит. */
export async function ensureBrand(db: DrizzleDb, rawName: string): Promise<{ id: number; slug: string }> {
  const name = cleanName(rawName, 'марку')
  const slug = slugify(name)
  if (!slug) throw new CatalogEditError('Название марки латиницей или кириллицей, без одних знаков')

  const [found] = await db.select({ id: brands.id, slug: brands.slug }).from(brands).where(eq(brands.slug, slug))
  if (found) return found

  const [created] = await db
    .insert(brands)
    .values({ slug, name, addedByOwner: true })
    .returning({ id: brands.id, slug: brands.slug })
  return created
}

export async function ensureModel(
  db: DrizzleDb,
  brandId: number,
  rawName: string,
): Promise<{ id: number; slug: string }> {
  const name = cleanName(rawName, 'модель')
  const slug = slugify(name)
  if (!slug) throw new CatalogEditError('Название модели латиницей или кириллицей, без одних знаков')

  const [found] = await db
    .select({ id: models.id, slug: models.slug })
    .from(models)
    .where(and(eq(models.brandId, brandId), eq(models.slug, slug)))
  if (found) return found

  const [created] = await db
    .insert(models)
    .values({ brandId, slug, name, addedByOwner: true })
    .returning({ id: models.id, slug: models.slug })
  return created
}

/**
 * Кузов: поколение и годы. Адрес — как у поставщика: «nf-2010-2018»,
 * «3-2018»; без поколения и годов — адрес модели.
 */
export async function addVariant(
  db: DrizzleDb,
  modelId: number,
  input: { generation: string; yearFrom: number | null; yearTo: number | null },
): Promise<number> {
  const generation = input.generation.trim().replace(/\s+/g, ' ') || null
  if (generation && generation.length > 40) throw new CatalogEditError('Слишком длинное поколение — хватит «2» или «NF»')
  const { yearFrom, yearTo } = input
  const thisYear = new Date().getFullYear() + 1
  for (const year of [yearFrom, yearTo]) {
    if (year !== null && (year < 1950 || year > thisYear)) {
      throw new CatalogEditError(`Год ${year} выглядит неверно`)
    }
  }
  if (yearFrom && yearTo && yearTo < yearFrom) throw new CatalogEditError('Год окончания раньше начала')

  const [model] = await db
    .select({ slug: models.slug, name: models.name, brand: brands.name })
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(eq(models.id, modelId))
  if (!model) throw new CatalogEditError('Модель не найдена')

  const slug = slugify([generation, yearFrom, yearTo].filter(Boolean).join(' ')) || model.slug
  const [taken] = await db
    .select({ id: variants.id })
    .from(variants)
    .where(and(eq(variants.modelId, modelId), eq(variants.slug, slug)))
  if (taken) throw new CatalogEditError('Такой кузов у этой модели уже есть')

  const years = yearFrom ? `${yearFrom}-${yearTo ?? ''}` : ''
  const [created] = await db
    .insert(variants)
    .values({
      modelId,
      slug,
      name: [model.brand, model.name, generation, years].filter(Boolean).join(' '),
      generation,
      yearFrom,
      yearTo,
      addedByOwner: true,
    })
    .returning({ id: variants.id })
  return created.id
}

/**
 * Удалить можно только своё и только пустое: кузов, марку или модель,
 * к которым не привязан ни один фаркоп. Иначе удаление тихо уносило бы
 * совместимость товаров.
 */
export async function deleteOwnVariant(db: DrizzleDb, variantId: number): Promise<void> {
  const [variant] = await db
    .select({ modelId: variants.modelId, own: variants.addedByOwner })
    .from(variants)
    .where(eq(variants.id, variantId))
  if (!variant) return
  if (!variant.own) throw new CatalogEditError('Удалить можно только добавленный вами кузов')

  const [used] = await db.select({ n: count() }).from(fitments).where(eq(fitments.variantId, variantId))
  if (Number(used?.n ?? 0) > 0) throw new CatalogEditError('К кузову привязаны фаркопы — сначала уберите их')

  await db.delete(variants).where(eq(variants.id, variantId))

  // Модель и марка, оставшиеся пустыми и добавленные владельцем, уходят следом.
  const [modelLeft] = await db.select({ n: count() }).from(variants).where(eq(variants.modelId, variant.modelId))
  if (Number(modelLeft?.n ?? 0) === 0) {
    const [model] = await db
      .select({ brandId: models.brandId, own: models.addedByOwner })
      .from(models)
      .where(eq(models.id, variant.modelId))
    if (model?.own) {
      await db.delete(models).where(eq(models.id, variant.modelId))
      const [brandLeft] = await db.select({ n: count() }).from(models).where(eq(models.brandId, model.brandId))
      if (Number(brandLeft?.n ?? 0) === 0) {
        await db.delete(brands).where(and(eq(brands.id, model.brandId), eq(brands.addedByOwner, true)))
      }
    }
  }
  await recalculateCounters(db)
}

export interface OwnCar {
  variantId: number
  brand: string
  model: string
  label: string
  productCount: number
  onSite: boolean
}

/** Машины, добавленные владельцем, — для списка в «Машинах». */
export async function listOwnCars(db: DrizzleDb): Promise<OwnCar[]> {
  const rows = await db
    .select({
      variantId: variants.id,
      brand: brands.name,
      model: models.name,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      productCount: variants.productCount,
      onSite: variants.isPublished,
    })
    .from(variants)
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(eq(variants.addedByOwner, true))
    .orderBy(asc(brands.name), asc(models.name), asc(variants.yearFrom))

  return rows.map((row) => ({
    variantId: row.variantId,
    brand: row.brand,
    model: row.model,
    label: variantLabel(row.generation, row.yearFrom, row.yearTo),
    productCount: row.productCount,
    onSite: row.onSite,
  }))
}

/* ── Свой фаркоп ───────────────────────────────────────────────────── */

/** Характеристики своего фаркопа — общие для заведения и правки. */
export interface OwnSpecs {
  manufacturer: string
  inStock: boolean
  deliveryText: string
  ballType: string
  towLoadKg: number | null
  verticalLoadKg: number | null
  weightKg: number | null
  bumperCut: 'not_required' | 'required' | 'unknown'
  electricsIncluded: boolean | null
}

function checkSpecs(input: OwnSpecs): void {
  /*
    Опечатка в нагрузке уходит прямо в фильтр каталога: «-1500» или
    «150000» выкинули бы фаркоп из подбора по нагрузке или поставили бы
    его первым. Пределы с запасом против любых легковых и фургонов.
  */
  for (const [value, max, what] of [
    [input.towLoadKg, 10_000, 'тяговая нагрузка'],
    [input.verticalLoadKg, 1_000, 'вертикальная нагрузка'],
    [input.weightKg, 200, 'масса фаркопа'],
  ] as const) {
    if (value !== null && (value <= 0 || value > max)) throw new CatalogEditError(`Проверьте поле: ${what}`)
  }
  if (input.ballType.trim().length > 20) throw new CatalogEditError('Тип шара — коротко: A, C, F')
  if (input.deliveryText.trim().length > 80) throw new CatalogEditError('Срок поставки — коротко: «3–5 дней»')
}

export interface NewProduct extends OwnSpecs {
  article: string
  price: number
  description: string
  variantId: number
}

export async function addProduct(db: DrizzleDb, input: NewProduct): Promise<string> {
  const article = input.article.trim()
  if (!article) throw new CatalogEditError('Укажите артикул')
  if (article.length > 40) throw new CatalogEditError('Слишком длинный артикул')
  const slug = slugifyArticle(article)
  if (!slug) throw new CatalogEditError('Артикул из одних знаков — так нельзя')
  if (!Number.isInteger(input.price) || input.price <= 0) throw new CatalogEditError('Укажите цену')
  if (input.price > 10_000_000) throw new CatalogEditError('Цена выглядит неверно')
  checkSpecs(input)
  if (input.description.length > 5000) throw new CatalogEditError('Описание слишком длинное')

  const [taken] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug))
  if (taken) {
    throw new CatalogEditError(
      `Артикул ${article} уже есть в каталоге. Найдите его в «Товарах» и добавьте машину в «Подходит к»`,
    )
  }

  const manufacturerId = await ensureManufacturer(db, input.manufacturer)

  const [product] = await db
    .insert(products)
    .values({
      slug,
      article,
      manufacturerId,
      description: input.description.trim(),
      sourcePrice: input.price,
      inStock: input.inStock,
      deliveryText: input.deliveryText.trim() || null,
      ballType: input.ballType.trim() || null,
      towLoadKg: input.towLoadKg,
      verticalLoadKg: input.verticalLoadKg,
      weightKg: input.weightKg,
      bumperCut: input.bumperCut,
      electricsIncluded: input.electricsIncluded,
      addedByOwner: true,
    })
    .returning({ id: products.id })

  await db.insert(fitments).values({ productId: product.id, variantId: input.variantId, addedByOwner: true })
  await recalculateCounters(db)
  return slug
}

/** Производителя по названию: есть — вернёт его, нет — добавит. */
async function ensureManufacturer(db: DrizzleDb, rawName: string): Promise<number> {
  const name = cleanName(rawName, 'производителя')
  const slug = slugify(name)
  if (!slug) throw new CatalogEditError('Название производителя латиницей или кириллицей, без одних знаков')

  const [found] = await db.select({ id: manufacturers.id }).from(manufacturers).where(eq(manufacturers.slug, slug))
  if (found) return found.id

  const [created] = await db
    .insert(manufacturers)
    .values({ slug, name })
    .returning({ id: manufacturers.id })
  return created.id
}

/**
 * Правка характеристик своего фаркопа.
 *
 * Только своего: у товаров из выгрузки характеристики описывают изделие
 * завода, и правка здесь разошлась бы с ним молча. Артикул, цена и
 * описание правятся у всех товаров обычными правками — здесь их нет.
 */
export async function updateOwnProduct(db: DrizzleDb, slug: string, input: OwnSpecs): Promise<void> {
  const [product] = await db
    .select({ id: products.id, own: products.addedByOwner })
    .from(products)
    .where(eq(products.slug, slug))
  if (!product) throw new CatalogEditError('Товар не найден')
  if (!product.own) throw new CatalogEditError('Характеристики правятся только у фаркопов, заведённых вами')

  checkSpecs(input)
  const manufacturerId = await ensureManufacturer(db, input.manufacturer)

  await db
    .update(products)
    .set({
      manufacturerId,
      inStock: input.inStock,
      deliveryText: input.deliveryText.trim() || null,
      ballType: input.ballType.trim() || null,
      towLoadKg: input.towLoadKg,
      verticalLoadKg: input.verticalLoadKg,
      weightKg: input.weightKg,
      bumperCut: input.bumperCut,
      electricsIncluded: input.electricsIncluded,
    })
    .where(eq(products.id, product.id))
}

/** Производители для подсказки в форме — чтобы не плодить «Ориs» и «Oris». */
export async function manufacturerNames(db: DrizzleDb): Promise<string[]> {
  const rows = await db.select({ name: manufacturers.name }).from(manufacturers).orderBy(asc(manufacturers.name))
  return rows.map((row) => row.name)
}

/** Типы шара, которые уже встречаются в каталоге, — для выбора в форме. */
export async function ballTypes(db: DrizzleDb): Promise<string[]> {
  const rows = await db
    .selectDistinct({ ball: products.ballType })
    .from(products)
    .orderBy(asc(products.ballType))
  return rows.map((row) => row.ball).filter((ball): ball is string => Boolean(ball))
}
