/**
 * Фото товаров, загруженные владельцем, — для каталога.
 *
 * Хранятся в таблице product_photos (см. src/db/schema.ts). Здесь —
 * чтение одним запросом на весь процесс и выбор, какое фото показать.
 *
 * Правило выбора одно на весь сайт:
 *
 *   фото на этой машине → общее фото товара → изображение от завода.
 *
 * Фото на чужой машине не показывается никогда: покупатель Cayenne,
 * увидев в карточке Audi Q7, решит, что фаркоп не для него.
 */
import { asc } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { productPhotos } from '../db/schema'

export interface OwnPhotos {
  /** Общие фото — сам фаркоп. Видны везде. */
  general: string[]
  /** Фото на машине: «марка/модель» → адреса по порядку. */
  byModel: Record<string, string[]>
}

/** Ключ модели — тот же, что в адресах каталога: «audi/q7». */
export function modelKey(brandSlug: string, modelSlug: string): string {
  return `${brandSlug}/${modelSlug}`
}

export async function loadOwnPhotos(db: DrizzleDb): Promise<Record<string, OwnPhotos>> {
  const rows = await db
    .select({
      slug: productPhotos.productSlug,
      modelKey: productPhotos.modelKey,
      url: productPhotos.url,
    })
    .from(productPhotos)
    .orderBy(asc(productPhotos.productSlug), asc(productPhotos.position), asc(productPhotos.id))

  const bySlug: Record<string, OwnPhotos> = {}
  for (const row of rows) {
    const entry = (bySlug[row.slug] ??= { general: [], byModel: {} })
    if (row.modelKey === '') entry.general.push(row.url)
    else (entry.byModel[row.modelKey] ??= []).push(row.url)
  }
  return bySlug
}

/*
  Кеш на процесс — по той же причине, что у правок цен
  (src/catalog/overrides.ts): сборка обходит восемь тысяч страниц, и
  запрос на каждой превратил бы её в часы. Админка сбрасывает кеш после
  каждой правки фото.
*/
const cache = globalThis as typeof globalThis & {
  __vashfarkopOwnPhotos?: Promise<Record<string, OwnPhotos>>
}

export function getOwnPhotos(db: DrizzleDb): Promise<Record<string, OwnPhotos>> {
  cache.__vashfarkopOwnPhotos ??= loadOwnPhotos(db).catch((error: unknown) => {
    cache.__vashfarkopOwnPhotos = undefined
    throw error
  })
  return cache.__vashfarkopOwnPhotos
}

export function forgetOwnPhotos(): void {
  cache.__vashfarkopOwnPhotos = undefined
}

/**
 * Главное фото товара для карточки.
 *
 * С машиной — сначала фото на ней. Без машины (страница товара, подбор,
 * похожие) — только общее: там неизвестно, чья машина у покупателя.
 * null — своих фото нет, остаётся изображение от завода.
 */
export function mainOwnPhoto(photos: OwnPhotos | undefined, model?: string): string | null {
  if (!photos) return null
  if (model) {
    const onCar = photos.byModel[model]?.[0]
    if (onCar) return onCar
  }
  return photos.general[0] ?? null
}

export interface PhotoGroup {
  /** '' — общие фото; иначе ключ модели. */
  key: string
  /** «Audi Q7» — для подписи; у общих пусто. */
  label: string
  photos: string[]
}

/**
 * Фото товара группами — для страницы товара.
 *
 * Общие идут первыми, дальше машины в том же порядке, в каком они
 * перечислены в «Подходит к». Пустые группы не попадают: вкладка «на
 * Touareg» без единого снимка только обещала бы.
 */
export function photoGroups(
  photos: OwnPhotos | undefined,
  cars: { brand: string; brandSlug: string; model: string; modelSlug: string }[],
): PhotoGroup[] {
  if (!photos) return []

  const groups: PhotoGroup[] = []
  if (photos.general.length > 0) groups.push({ key: '', label: '', photos: photos.general })

  const seen = new Set<string>()
  for (const car of cars) {
    const key = modelKey(car.brandSlug, car.modelSlug)
    if (seen.has(key)) continue
    seen.add(key)
    const onCar = photos.byModel[key]
    if (onCar?.length) groups.push({ key, label: `${car.brand} ${car.model}`, photos: onCar })
  }
  return groups
}

/** Подставляет своё фото в список товаров, не трогая остальное. */
export function withOwnPhoto<T extends { slug: string; photo: string | null }>(
  rows: T[],
  all: Record<string, OwnPhotos>,
  model?: string,
): T[] {
  return rows.map((row) => {
    const own = mainOwnPhoto(all[row.slug], model)
    return own ? { ...row, photo: own } : row
  })
}
