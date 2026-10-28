import { and, asc, count, eq, ilike, inArray, or, type SQL } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { brands, fitments, manufacturers, models, overrides, products, variants } from '../db/schema'
import { productPhotoSrc } from '../catalog/product-photos'

/**
 * Список товаров для админки.
 *
 * ── Чем отличается от catalog/queries.ts ──
 *
 * Витрине нужен товар как он выглядит покупателю: цена уже с правкой,
 * скрытые отброшены. Админке — обе цены рядом: поставщика и своя. Иначе
 * владелец не видит, от чего он отклонился, и не замечает, что
 * поставщик поднял цену, а своя так и стоит прошлогодняя.
 *
 * Поэтому отдельный запрос, а не фильтр поверх витринного.
 *
 * ── Почему постранично ──
 *
 * Товаров 5 808. Отдать их одной страницей — это 5 808 полей ввода в
 * разметке и несколько мегабайт на каждое обновление. Страница по
 * пятьдесят: поиск по артикулу находит нужное за один запрос, а листать
 * подряд всё равно никто не станет.
 */

/** Сколько строк на странице. */
export const PAGE_SIZE = 50

export interface AdminProduct {
  slug: string
  /** Артикул из выгрузки — его показываем как исходный. */
  article: string
  manufacturer: string
  description: string
  /** Цена поставщика. */
  sourcePrice: number
  inStock: boolean
  /**
   * Картинка, собранная парсером с сайта завода, или null.
   *
   * Своя фотография владельца сюда не входит — она лежит правкой и
   * приходит в `own.photo`. Разделены намеренно: на экране видно, что
   * было до его правки, и куда вернётся при сбросе.
   */
  parsedPhoto: string | null
  /** Правки владельца по этому товару: поле → значение. */
  own: Record<string, string>
  /**
   * Заведён владельцем, а не пришёл из выгрузки. Только у таких
   * характеристики правятся в админке — см. OwnProductSpecs.
   */
  addedByOwner: boolean
  specs: ProductSpecs
}

/** Характеристики, которые владелец задаёт своему фаркопу. */
export interface ProductSpecs {
  ballType: string | null
  towLoadKg: number | null
  verticalLoadKg: number | null
  weightKg: number | null
  bumperCut: 'not_required' | 'required' | 'unknown'
  electricsIncluded: boolean | null
  deliveryText: string | null
}

/**
 * Условие поиска.
 *
 * Ищем по артикулу и по описанию сразу. Описание — это «Фаркоп на Audi
 * 100», то есть поиск по нему заменяет поиск по марке и модели, не
 * требуя соединения с тремя таблицами. Владелец вводит «ларгус» или
 * «Steinhof» и находит.
 *
 * `ilike` без учёта регистра: артикулы в выгрузке набраны по-разному, и
 * «e0801aa» обязан находить «E0801AA».
 */
function searchCondition(query: string): SQL | undefined {
  const text = query.trim()
  if (text === '') return undefined

  const pattern = `%${text}%`
  return or(
    ilike(products.article, pattern),
    ilike(products.description, pattern),
    ilike(manufacturers.name, pattern),
  )
}

/** Выбранная машина: марка, затем модель, затем кузов. */
export interface CarScope {
  brand?: string
  model?: string
  variant?: string
}

/**
 * Отбор по машине.
 *
 * ── Почему через подзапрос, а не соединением ──
 *
 * Один фаркоп подходит к нескольким кузовам одной модели, и обычное
 * соединение с таблицей связок вернуло бы его по разу на каждый кузов.
 * Пятьдесят строк на странице превратились бы в пятьдесят записей, из
 * которых половина — повторы одного товара с теми же полями ввода.
 *
 * Подзапрос отвечает на вопрос «подходит ли вообще», а не «сколько
 * раз подходит», и повторов не даёт. Он же не ломает подсчёт для
 * листалки: иначе найденных оказывалось бы больше, чем товаров.
 *
 * ── Почему кузов можно не выбирать ──
 *
 * Владелец приходит с «нужен фаркоп на Ларгус». Поколение он чаще
 * всего не знает и знать не обязан — ему нужно увидеть всё, что есть
 * на эту модель, и уже среди этого найти свой артикул.
 */
function carCondition(db: DrizzleDb, scope: CarScope): SQL | undefined {
  if (!scope.brand) return undefined

  const matching = db
    .select({ id: fitments.productId })
    .from(fitments)
    .innerJoin(variants, eq(variants.id, fitments.variantId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      and(
        eq(brands.slug, scope.brand),
        scope.model ? eq(models.slug, scope.model) : undefined,
        scope.variant ? eq(variants.slug, scope.variant) : undefined,
      ),
    )

  return inArray(products.id, matching)
}

/** Поиск словами и отбор по машине работают вместе, а не вместо друг друга. */
function filters(db: DrizzleDb, query: string, scope: CarScope): SQL | undefined {
  return and(searchCondition(query), carCondition(db, scope))
}

export async function countAdminProducts(
  db: DrizzleDb,
  query = '',
  scope: CarScope = {},
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(products)
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(filters(db, query, scope))
  return Number(row?.n ?? 0)
}

export async function listAdminProducts(
  db: DrizzleDb,
  { query = '', page = 1, scope = {} }: { query?: string; page?: number; scope?: CarScope },
): Promise<AdminProduct[]> {
  const rows = await db
    .select({
      slug: products.slug,
      article: products.article,
      manufacturer: manufacturers.name,
      description: products.description,
      sourcePrice: products.sourcePrice,
      inStock: products.inStock,
      addedByOwner: products.addedByOwner,
      ballType: products.ballType,
      towLoadKg: products.towLoadKg,
      verticalLoadKg: products.verticalLoadKg,
      weightKg: products.weightKg,
      bumperCut: products.bumperCut,
      electricsIncluded: products.electricsIncluded,
      deliveryText: products.deliveryText,
    })
    .from(products)
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(filters(db, query, scope))
    .orderBy(asc(products.article))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)

  /*
    Правки читаются одним запросом на всю страницу, а не по товару.
    Пятьдесят запросов вместо одного — это полсекунды на отрисовку
    таблицы, заметно на глаз при каждом сохранении: после правки
    страница перерисовывается целиком.

    Берутся все правки товаров, а не только по этим пятидесяти: их в
    базе на порядки меньше, чем товаров, и условие IN на пятьдесят
    слагов дороже, чем прочитать всё.
  */
  const edits = await db
    .select({
      targetKey: overrides.targetKey,
      field: overrides.field,
      value: overrides.value,
    })
    .from(overrides)
    .where(eq(overrides.entity, 'product'))

  const byProduct = new Map<string, Record<string, string>>()
  for (const edit of edits) {
    if (edit.field === '__dirty' || edit.value === null) continue
    const bucket = byProduct.get(edit.targetKey) ?? {}
    bucket[edit.field] = edit.value
    byProduct.set(edit.targetKey, bucket)
  }

  return rows.map(
    ({ ballType, towLoadKg, verticalLoadKg, weightKg, bumperCut, electricsIncluded, deliveryText, ...row }) => ({
      ...row,
      specs: { ballType, towLoadKg, verticalLoadKg, weightKg, bumperCut, electricsIncluded, deliveryText },
      parsedPhoto: productPhotoSrc(row.slug),
      own: byProduct.get(row.slug) ?? {},
    }),
  )
}

/** Сколько товаров владелец уже правил — для сводки. */
export async function countEditedProducts(db: DrizzleDb): Promise<number> {
  const rows = await db
    .select({ targetKey: overrides.targetKey })
    .from(overrides)
    .where(eq(overrides.entity, 'product'))

  return new Set(rows.map((r) => r.targetKey)).size
}

/** Сколько товаров скрыто с витрины. */
export async function countHiddenProducts(db: DrizzleDb): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(overrides)
    .where(and(eq(overrides.entity, 'product'), eq(overrides.field, 'hidden')))
  return Number(row?.n ?? 0)
}
