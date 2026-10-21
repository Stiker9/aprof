import { and, asc, eq, ne } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { brands, fitments, manufacturers, models, products, variants } from '../db/schema'
import { formatVariantShort } from './format'
import { applyToList, applyProductOverride, getProductOverrides, isHidden } from './overrides'
import { productPhotoSrc } from './product-photos'

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
  /**
   * Адрес своей картинки этого артикула или null.
   *
   * Считается здесь, а не в компоненте карточки, намеренно. Список
   * товаров с картинками — четыре тысячи слагов; если бы его читал
   * компонент, он уехал бы в браузер целиком и добавил 47 КБ к каждой
   * странице каталога. Сервер знает ответ и кладёт его строкой.
   */
  photo: string | null
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
  const rows = await db
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

  return applyToList(
    rows.map((r) => ({ ...r, photo: productPhotoSrc(r.slug) })),
    await getProductOverrides(db),
  )
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
  if (!row) return null

  // Скрытый товар — это «нет такой страницы», а не пустая карточка:
  // иначе покупатель по старой ссылке увидел бы товар без цены и решил,
  // что сайт сломан.
  const override = (await getProductOverrides(db))[row.slug]
  if (isHidden(override)) return null

  return applyProductOverride({ ...row, photo: productPhotoSrc(row.slug) }, override)
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
  const overrides = await getProductOverrides(db)

  // Скрытому товару страница не собирается вовсе. Собрать и не дать
  // ссылок было бы хуже: страница осталась бы в поиске и открывалась
  // бы по прямому адресу.
  return rows.map((r) => r.slug).filter((slug) => !isHidden(overrides[slug]))
}

/**
 * Сколько всего товаров в каталоге.
 *
 * Считать сложением счётчиков по маркам нельзя: один фаркоп подходит
 * к машинам разных марок и попал бы в сумму несколько раз. На главной
 * это давало 7 339 вместо 5 808.
 */
export async function countProducts(db: DrizzleDb): Promise<number> {
  const rows = await db.select({ slug: products.slug }).from(products)
  const overrides = await getProductOverrides(db)
  return rows.filter((row) => !isHidden(overrides[row.slug])).length
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
    /*
      Берём с запасом: скрытые владельцем отсеиваются уже здесь, в коде,
      и при лимите ровно в limit блок «похожие» на иных страницах
      оказался бы короче, чем надо, — а то и пустым.
    */
    .limit(limit * 3)

  const similar: ProductRow[] = rows.map((r) => ({
    slug: r.slug,
    photo: productPhotoSrc(r.slug),
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

  return applyToList(similar, await getProductOverrides(db)).slice(0, limit)
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
  const rows = await db.select({ slug: products.slug, price: products.sourcePrice }).from(products)
  const overrides = await getProductOverrides(db)

  /*
    Цена считается по тем же правилам, что и в карточке: своя цена
    владельца вместо цены поставщика, скрытые товары не в счёт. Иначе
    на главной стояло бы «цены от 3 900», а товара за 3 900 на сайте
    нет — он либо скрыт, либо стоит дороже.
  */
  const visible = rows
    .filter((row) => !isHidden(overrides[row.slug]))
    .map((row) => {
      const own = Number(overrides[row.slug]?.price)
      return Number.isFinite(own) && own > 0 ? own : row.price
    })

  if (visible.length === 0) {
    throw new Error('В каталоге нет товаров — не от чего считать минимальную цену')
  }
  return visible.reduce((min, price) => (price < min ? price : min), visible[0])
}

/**
 * Весь каталог в сжатом виде — для страницы подбора, где 5 808 позиций
 * фильтруются на клиенте.
 *
 * Запись — массив, а не объект: имена полей повторились бы 5 808 раз и
 * весили бы больше значений. Порядок полей зафиксирован здесь и читается
 * на той стороне — см. CompactProduct.
 *
 * Наличие своей картинки кладётся одним битом, а не адресом: файл
 * всегда лежит по адресу /images/products/<слаг>.webp, и слаг в записи
 * уже есть. Повторять предсказуемую строку 4 114 раз незачем.
 *
 * Бит нужен именно здесь, в подгружаемом файле. Список товаров с
 * картинками лежит в src/catalog/product-photos.ts, но читать его в
 * компоненте карточки нельзя: карточка рисуется и на клиенте, и тогда
 * все четыре тысячи слагов уезжают в браузер отдельным куском на 47 КБ.
 * Так и было ровно один деплой.
 */
export type CompactProduct = [
  slug: string,
  article: string,
  manufacturer: string,
  price: number,
  inStock: 0 | 1,
  deliveryText: string | null,
  ballType: string | null,
  towLoadKg: number | null,
  verticalLoadKg: number | null,
  bumperCut: 0 | 1 | 2,
  hasPhoto: 0 | 1,
]

export async function listAllProductsCompact(db: DrizzleDb): Promise<CompactProduct[]> {
  const rows = await db
    .select({
      slug: products.slug,
      article: products.article,
      manufacturer: manufacturers.name,
      price: products.sourcePrice,
      inStock: products.inStock,
      deliveryText: products.deliveryText,
      ballType: products.ballType,
      towLoadKg: products.towLoadKg,
      verticalLoadKg: products.verticalLoadKg,
      bumperCut: products.bumperCut,
    })
    .from(products)
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .orderBy(asc(products.sourcePrice), asc(products.id))

  /*
    Правки накладываются и здесь: этот файл читает страница подбора, и
    цена в её плитках обязана совпадать с ценой в карточке товара.
    Разойдись они — человек увидел бы одну цену в списке и другую после
    перехода.

    Пересортировка по цене идёт внутри applyToList: порядок из базы —
    по цене поставщика, а в подборе список показывается «сначала
    дешёвые», уже со своими ценами.
  */
  const visible = applyToList(
    rows.map((r) => ({ ...r, description: '', photo: productPhotoSrc(r.slug) })),
    await getProductOverrides(db),
  )

  return visible.map((r) => {
    return [
      r.slug,
      r.article,
      r.manufacturer,
      r.price,
      r.inStock ? 1 : 0,
      r.deliveryText,
      r.ballType,
      r.towLoadKg,
      r.verticalLoadKg,
      r.bumperCut === 'not_required' ? 0 : r.bumperCut === 'required' ? 1 : 2,
      r.photo ? 1 : 0,
    ]
  })
}

/**
 * Какие товары подходят каждому кузову — для подбора по параметрам.
 *
 * Отдаётся вместе со списком товаров: там человек выбирает машину прямо
 * в карточке фильтра, и список должен сузиться на месте, без перехода
 * на страницу кузова.
 *
 * Ключ — «марка/модель/кузов», потому что слаг кузова сам по себе не
 * уникален: «2010-2015» встречается у десятков моделей.
 *
 * Значения — не слаги товаров, а их порядковые номера в том же списке,
 * что отдаёт listAllProductsCompact. Слагами это весило бы вчетверо
 * больше при том же смысле; порядок у обоих запросов один и тот же —
 * по возрастанию цены, затем по id.
 */
export type FitmentIndex = Record<string, number[]>

export async function buildFitmentIndex(db: DrizzleDb): Promise<FitmentIndex> {
  const ordered = await db
    .select({ id: products.id })
    .from(products)
    .orderBy(asc(products.sourcePrice), asc(products.id))

  const position = new Map(ordered.map((p, i) => [p.id, i]))

  const rows = await db
    .select({
      brand: brands.slug,
      model: models.slug,
      variant: variants.slug,
      productId: fitments.productId,
    })
    .from(fitments)
    .innerJoin(variants, eq(variants.id, fitments.variantId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))

  const index: FitmentIndex = {}
  for (const row of rows) {
    const key = `${row.brand}/${row.model}/${row.variant}`
    const pos = position.get(row.productId)
    if (pos === undefined) continue
    ;(index[key] ??= []).push(pos)
  }

  for (const key of Object.keys(index)) index[key].sort((a, b) => a - b)
  return index
}

/**
 * Самая низкая цена фаркопа для марки или модели — для «цены от …» в
 * описании страницы в выдаче.
 *
 * Считается по тем же правилам, что minProductPrice: своя цена
 * владельца вместо цены поставщика, скрытые товары не в счёт. Иначе в
 * сниппете стояла бы цена, которой на странице нет.
 *
 * Null, если у марки или модели нет ни одного видимого товара — тогда
 * описание обходится без цены, а не пишет «от 0 ₽».
 */
export async function minPriceFor(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug?: string,
): Promise<number | null> {
  const rows = await db
    .selectDistinct({ slug: products.slug, price: products.sourcePrice })
    .from(products)
    .innerJoin(fitments, eq(fitments.productId, products.id))
    .innerJoin(variants, eq(variants.id, fitments.variantId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      modelSlug
        ? and(eq(brands.slug, brandSlug), eq(models.slug, modelSlug))
        : eq(brands.slug, brandSlug),
    )
  const overrides = await getProductOverrides(db)
  const prices = rows
    .filter((row) => !isHidden(overrides[row.slug]))
    .map((row) => {
      const own = Number(overrides[row.slug]?.price)
      return Number.isFinite(own) && own > 0 ? own : row.price
    })
  return prices.length === 0 ? null : Math.min(...prices)
}
