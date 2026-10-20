/**
 * Правки владельца поверх выгрузки поставщика.
 *
 * ── Зачем слой ──
 *
 * Каталог приходит из выгрузки: 5 808 товаров, цены, остатки, связки с
 * машинами. При обновлении прайса таблица товаров перезаписывается
 * целиком. Если владелец поправит цену прямо в ней, правка исчезнет на
 * первом же импорте — тихо, и заметят это по жалобе покупателя.
 *
 * Поэтому правки лежат отдельной таблицей и накладываются поверх при
 * чтении. Импорт их не видит и не трогает.
 *
 * ── Что побеждает ──
 *
 * Правка всегда. Если владелец поставил цену — показывается она, даже
 * если поставщик прислал другую. Отменить можно только явно, удалив
 * правку: иначе «моя цена пропала после обновления» повторяется снова.
 *
 * Исключение — остатки. Их владелец не ведёт: 3 454 позиции меняются
 * ежедневно, вручную такое не держат. Наличие всегда из выгрузки, если
 * товар не помечен «веду сам».
 */
import { eq } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { overrides } from '../db/schema'

/** Поля товара, которые можно править. Остальные идут из выгрузки. */
export const PRODUCT_FIELDS = [
  'price',
  'article',
  'description',
  'photo',
  /** Товар выходит из-под выгрузки целиком, включая остатки. */
  'selfManaged',
  /** Убрать с сайта, не удаляя из базы. */
  'hidden',
] as const

export type ProductField = (typeof PRODUCT_FIELDS)[number]

/** Правки по одному товару: поле → значение. */
export type ProductOverride = Partial<Record<ProductField, string>>

/** Все правки товаров разом: slug → правки. */
export type ProductOverrides = Record<string, ProductOverride>

/**
 * Читает правки товаров одним запросом.
 *
 * Одним, а не по товару: страницы каталога собираются пачками по
 * несколько тысяч, и запрос на каждый товар превратил бы сборку в
 * часы. Правок в разы меньше, чем товаров, — весь их объём спокойно
 * живёт в памяти процесса сборки.
 */
export async function loadProductOverrides(db: DrizzleDb): Promise<ProductOverrides> {
  const rows = await db
    .select({
      targetKey: overrides.targetKey,
      field: overrides.field,
      value: overrides.value,
    })
    .from(overrides)
    .where(eq(overrides.entity, 'product'))

  const byProduct: ProductOverrides = {}
  for (const row of rows) {
    const existing = byProduct[row.targetKey] ?? (byProduct[row.targetKey] = {})
    existing[row.field as ProductField] = row.value ?? undefined
  }
  return byProduct
}

export interface OverridableProduct {
  slug: string
  article: string
  description: string
  price: number
  photo: string | null
}

/**
 * Накладывает правки на товар из выгрузки.
 *
 * Цена разбирается с проверкой: в поле лежит строка, и битое значение
 * не должно превратиться в NaN на витрине. Если разбор не удался —
 * остаётся цена поставщика, это честнее, чем показать «NaN ₽».
 */
export function applyProductOverride<T extends OverridableProduct>(
  product: T,
  override: ProductOverride | undefined,
): T {
  if (!override) return product

  const price = override.price === undefined ? null : Number(override.price)
  const validPrice = price !== null && Number.isFinite(price) && price > 0 ? price : null

  return {
    ...product,
    article: override.article ?? product.article,
    description: override.description ?? product.description,
    price: validPrice ?? product.price,
    photo: override.photo ?? product.photo,
  }
}

/** Товар скрыт владельцем — не показываем и не собираем для него страницу. */
export function isHidden(override: ProductOverride | undefined): boolean {
  return override?.hidden === '1'
}

/**
 * Правки, прочитанные один раз на весь процесс сборки.
 *
 * Сборка обходит 8 257 страниц, и на каждой есть товары. Без этого
 * кеша один и тот же запрос ушёл бы в базу тысячи раз — а PGlite это
 * PostgreSQL в WebAssembly, однопоточный, и каждый такой запрос стоит
 * миллисекунды, которые складываются в минуты.
 *
 * Кеш живёт на globalThis, а не в переменной модуля: в режиме
 * разработки Next перезагружает модули при каждой правке, и обычная
 * переменная обнулялась бы — по той же причине, что и кеш подключения
 * к базе (см. src/db/client.ts).
 *
 * Обратная сторона: правка, сделанная в админке при запущенной сборке,
 * в эту сборку не попадёт. Это верно и так — страницы, собранные до
 * неё, всё равно остались бы старыми. Лучше пусть вся выгрузка будет
 * из одного среза, чем наполовину из старого, наполовину из нового.
 */
const cache = globalThis as typeof globalThis & {
  __vashfarkopOverrides?: Promise<ProductOverrides>
}

export function getProductOverrides(db: DrizzleDb): Promise<ProductOverrides> {
  cache.__vashfarkopOverrides ??= loadProductOverrides(db).catch((error: unknown) => {
    cache.__vashfarkopOverrides = undefined
    throw error
  })
  return cache.__vashfarkopOverrides
}

/** Сбрасывает кеш — нужен админке после правки и тестам. */
export function forgetProductOverrides(): void {
  cache.__vashfarkopOverrides = undefined
}

/**
 * Накладывает правки на список товаров и убирает скрытые.
 *
 * Порядок пересобирается заново: из базы товары приходят отсортированными
 * по цене поставщика, а после правки цена другая, и список оказался бы
 * отсортирован по цифрам, которых на сайте нет.
 */
export function applyToList<T extends OverridableProduct>(
  rows: T[],
  overrides: ProductOverrides,
  sortByPrice = true,
): T[] {
  const kept = rows
    .filter((row) => !isHidden(overrides[row.slug]))
    .map((row) => applyProductOverride(row, overrides[row.slug]))

  return sortByPrice ? kept.sort((a, b) => a.price - b.price) : kept
}
