'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { forgetOwnPhotos } from '@/catalog/own-photos'
import { getDb } from '@/db/client'
import { requireAdmin } from './auth'
import {
  addFit,
  addProduct,
  addVariant,
  brandOptions,
  CatalogEditError,
  deleteOwnVariant,
  ensureBrand,
  ensureModel,
  modelOptions,
  removeFit,
  updateOwnProduct,
  variantOptions,
  type CarOption,
  type OwnSpecs,
} from './catalog-edit'
import { movePhotoTo } from './product-photos'
import { markDirty } from './store'

/**
 * Действия админки над каталогом: машины, совместимость, свои фаркопы.
 *
 * Отдельно от actions.ts — тот и так длинный, а эти действия правят
 * сам каталог, а не правки поверх него. Логика — в catalog-edit.ts.
 */

export interface ActionResult {
  error?: string
  ok?: string
}

/** Сбросить запомненные страницы админки и предпросмотра — см. actions.ts. */
function refresh(): void {
  revalidatePath('/admin', 'layout')
  revalidatePath('/', 'layout')
}

function message(error: unknown): string {
  if (error instanceof CatalogEditError) return error.message
  console.error(error)
  return 'Не получилось сохранить — попробуйте ещё раз'
}

function int(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').replace(/\s/g, '').replace(',', '.')
  if (!text) return null
  const number = Number(text)
  return Number.isFinite(number) ? Math.round(number) : null
}

/* ── Выбор машины ───────────────────────────────────────────────── */

export async function carOptions(brand?: string, model?: string): Promise<(CarOption & { id?: number })[]> {
  await requireAdmin()
  const db = await getDb()
  if (brand && model) return variantOptions(db, brand, model)
  if (brand) return modelOptions(db, brand)
  return brandOptions(db)
}

/* ── Совместимость ──────────────────────────────────────────────── */

export async function addFitAction(slug: string, variantId: number): Promise<ActionResult> {
  const session = await requireAdmin()
  try {
    const db = await getDb()
    await addFit(db, slug, variantId)
    await markDirty(db, 'product', slug, session.login)
    refresh()
    return { ok: 'Машина добавлена' }
  } catch (error) {
    return { error: message(error) }
  }
}

export async function removeFitAction(fitmentId: number): Promise<ActionResult> {
  const session = await requireAdmin()
  try {
    const db = await getDb()
    const slug = await removeFit(db, fitmentId)
    if (slug) await markDirty(db, 'product', slug, session.login)
    refresh()
    return {}
  } catch (error) {
    return { error: message(error) }
  }
}

/* ── Машины ─────────────────────────────────────────────────────── */

export async function addCarAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  try {
    const db = await getDb()
    // Одной транзакцией: ошибка в годах не должна оставить пустую марку.
    await db.transaction(async (tx) => {
      const brand = await ensureBrand(tx, String(formData.get('brand') ?? ''))
      const model = await ensureModel(tx, brand.id, String(formData.get('model') ?? ''))
      await addVariant(tx, model.id, {
        generation: String(formData.get('generation') ?? ''),
        yearFrom: int(formData.get('yearFrom')),
        yearTo: int(formData.get('yearTo')),
      })
    })
    refresh()
    return { ok: 'Машина добавлена. Теперь привяжите к ней фаркоп в «Товарах» — без него на сайте её не будет' }
  } catch (error) {
    return { error: message(error) }
  }
}

export async function deleteVariantAction(variantId: number): Promise<ActionResult> {
  await requireAdmin()
  try {
    await deleteOwnVariant(await getDb(), variantId)
    refresh()
    return {}
  } catch (error) {
    return { error: message(error) }
  }
}

/* ── Свой фаркоп ────────────────────────────────────────────────── */

const BUMPER = new Set(['not_required', 'required', 'unknown'])

/** Характеристики из формы — одинаково для нового фаркопа и правки. */
function specsFrom(formData: FormData): OwnSpecs {
  const bumper = String(formData.get('bumperCut') ?? 'unknown')
  const electrics = String(formData.get('electrics') ?? '')
  const weight = String(formData.get('weightKg') ?? '').replace(',', '.').trim()
  return {
    manufacturer: String(formData.get('manufacturer') ?? ''),
    inStock: formData.get('inStock') === 'on',
    deliveryText: String(formData.get('deliveryText') ?? ''),
    ballType: String(formData.get('ballType') ?? ''),
    towLoadKg: int(formData.get('towLoadKg')),
    verticalLoadKg: int(formData.get('verticalLoadKg')),
    weightKg: weight && Number.isFinite(Number(weight)) ? Number(weight) : null,
    bumperCut: (BUMPER.has(bumper) ? bumper : 'unknown') as OwnSpecs['bumperCut'],
    electricsIncluded: electrics === 'yes' ? true : electrics === 'no' ? false : null,
  }
}

export async function addProductAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin()
  let slug: string
  try {
    const variantId = int(formData.get('variantId'))
    if (!variantId) return { error: 'Выберите машину — марку, модель и кузов' }

    const db = await getDb()
    slug = await addProduct(db, {
      ...specsFrom(formData),
      article: String(formData.get('article') ?? ''),
      price: int(formData.get('price')) ?? 0,
      description: String(formData.get('description') ?? ''),
      variantId,
    })
    await markDirty(db, 'product', slug, session.login)
    refresh()
  } catch (error) {
    return { error: message(error) }
  }
  // Сразу к новому товару: там фото и остальные машины.
  redirect(`/admin/tovary?q=${encodeURIComponent(slug)}`)
}

export async function updateOwnProductAction(
  slug: string,
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin()
  try {
    const db = await getDb()
    await updateOwnProduct(db, slug, specsFrom(formData))
    await markDirty(db, 'product', slug, session.login)
    refresh()
    return { ok: 'Сохранено' }
  } catch (error) {
    return { error: message(error) }
  }
}

/* ── Фото: перенести в другую строку ──────────────────────────────── */

export async function movePhotoToAction(photoId: number, modelKey: string): Promise<ActionResult> {
  const session = await requireAdmin()
  if (modelKey && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(modelKey)) return { error: 'Не понятно, какая машина' }
  try {
    const db = await getDb()
    const slug = await movePhotoTo(db, photoId, modelKey)
    if (slug) await markDirty(db, 'product', slug, session.login)
    forgetOwnPhotos()
    refresh()
    return {}
  } catch (error) {
    return { error: message(error) }
  }
}
