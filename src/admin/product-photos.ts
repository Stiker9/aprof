import { and, asc, eq, inArray, max } from 'drizzle-orm'
import type { DrizzleDb } from '@/db/client'
import { brands, fitments, models, productPhotos, products, variants } from '@/db/schema'
import type { AdminPhotoGroup } from '@/components/admin/product-photos'

/**
 * Строки фото для товаров страницы админки: «Общие» и по строке на
 * каждую подходящую модель — даже пустую, иначе владельцу некуда
 * загрузить первое фото на Touareg.
 *
 * Двумя запросами на всю страницу, а не двумя на каждый из пятидесяти
 * товаров: PGlite однопоточная, и сотня мелких запросов заметна.
 */
export async function photoGroupsFor(
  db: DrizzleDb,
  slugs: string[],
): Promise<Record<string, AdminPhotoGroup[]>> {
  if (slugs.length === 0) return {}

  const [photos, cars] = await Promise.all([
    db
      .select({
        id: productPhotos.id,
        slug: productPhotos.productSlug,
        modelKey: productPhotos.modelKey,
        url: productPhotos.url,
      })
      .from(productPhotos)
      .where(inArray(productPhotos.productSlug, slugs))
      .orderBy(asc(productPhotos.position), asc(productPhotos.id)),
    db
      .selectDistinct({
        slug: products.slug,
        brandSlug: brands.slug,
        brand: brands.name,
        modelSlug: models.slug,
        model: models.name,
      })
      .from(fitments)
      .innerJoin(products, eq(products.id, fitments.productId))
      .innerJoin(variants, eq(variants.id, fitments.variantId))
      .innerJoin(models, eq(models.id, variants.modelId))
      .innerJoin(brands, eq(brands.id, models.brandId))
      .where(inArray(products.slug, slugs))
      .orderBy(asc(brands.name), asc(models.name)),
  ])

  const result: Record<string, AdminPhotoGroup[]> = {}
  for (const slug of slugs) result[slug] = [{ key: '', label: '', photos: [] }]

  for (const car of cars) {
    result[car.slug].push({
      key: `${car.brandSlug}/${car.modelSlug}`,
      label: `${car.brand} ${car.model}`,
      photos: [],
    })
  }

  for (const photo of photos) {
    const groups = result[photo.slug]
    let group = groups.find((g) => g.key === photo.modelKey)
    /*
      Фото на машине, которой у товара больше нет: выгрузка поставщика
      поменяла совместимость. Не прячем — показываем отдельной строкой,
      чтобы владелец мог удалить, а не гадать, куда делся снимок.
    */
    if (!group) {
      group = { key: photo.modelKey, label: `${photo.modelKey} (машины нет в совместимости)`, photos: [] }
      groups.push(group)
    }
    group.photos.push({ id: photo.id, url: photo.url })
  }

  return result
}

/**
 * Фото товаров в админке: список, добавление, удаление, порядок.
 *
 * Как фото выбираются на сайте — см. src/catalog/own-photos.ts. Здесь
 * только хранение. Каждая правка помечает товар «ждёт публикации»
 * (markDirty в действиях): страницы надо пересобрать.
 */

export interface AdminPhoto {
  id: number
  modelKey: string
  url: string
}

export async function listPhotos(db: DrizzleDb, slug: string): Promise<AdminPhoto[]> {
  return db
    .select({ id: productPhotos.id, modelKey: productPhotos.modelKey, url: productPhotos.url })
    .from(productPhotos)
    .where(eq(productPhotos.productSlug, slug))
    .orderBy(asc(productPhotos.modelKey), asc(productPhotos.position), asc(productPhotos.id))
}

/** Новое фото встаёт в конец своей группы. */
export async function addPhoto(
  db: DrizzleDb,
  slug: string,
  modelKey: string,
  url: string,
): Promise<void> {
  const [last] = await db
    .select({ position: max(productPhotos.position) })
    .from(productPhotos)
    .where(and(eq(productPhotos.productSlug, slug), eq(productPhotos.modelKey, modelKey)))

  await db.insert(productPhotos).values({
    productSlug: slug,
    modelKey,
    url,
    position: (last?.position ?? -1) + 1,
    createdAt: new Date().toISOString(),
  })
}

/** Удаляет фото и возвращает слаг товара — его надо пометить к публикации. */
export async function deletePhoto(db: DrizzleDb, id: number): Promise<string | null> {
  const [row] = await db
    .delete(productPhotos)
    .where(eq(productPhotos.id, id))
    .returning({ slug: productPhotos.productSlug })
  return row?.slug ?? null
}

/**
 * Сдвигает фото на место раньше или позже внутри своей группы.
 *
 * Позиции пересчитываются заново подряд: после удалений в них бывают
 * дыры, и обмен с соседом по номеру «±1» промахивался бы.
 */
export async function movePhoto(db: DrizzleDb, id: number, delta: -1 | 1): Promise<string | null> {
  const [photo] = await db
    .select({ slug: productPhotos.productSlug, modelKey: productPhotos.modelKey })
    .from(productPhotos)
    .where(eq(productPhotos.id, id))
  if (!photo) return null

  const group = await db
    .select({ id: productPhotos.id })
    .from(productPhotos)
    .where(
      and(eq(productPhotos.productSlug, photo.slug), eq(productPhotos.modelKey, photo.modelKey)),
    )
    .orderBy(asc(productPhotos.position), asc(productPhotos.id))

  const order = group.map((row) => row.id)
  const from = order.indexOf(id)
  const to = from + delta
  if (to < 0 || to >= order.length) return photo.slug
  ;[order[from], order[to]] = [order[to], order[from]]

  for (const [position, photoId] of order.entries()) {
    await db.update(productPhotos).set({ position }).where(eq(productPhotos.id, photoId))
  }
  return photo.slug
}
