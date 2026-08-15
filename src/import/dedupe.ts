import type { RawFitment, RawVariant } from './extract'

/**
 * Схлопывает повторяющиеся связки товар↔кузов.
 *
 * В источнике 16 995 записей, но уникальных пар только 10 140 —
 * 40% строк дублируются. Без очистки один и тот же фаркоп
 * показывался бы в списке дважды.
 *
 * При расхождении цен берётся наименьшая: покупателю нельзя
 * показать цену выше той, что есть в данных.
 */
export function dedupeFitments(list: RawFitment[]): RawFitment[] {
  const byPair = new Map<string, RawFitment>()

  for (const item of list) {
    const key = `${item.productIndex}:${item.variantIndex}`
    const existing = byPair.get(key)

    if (!existing) {
      byPair.set(key, item)
      continue
    }

    if (item.price !== null && (existing.price === null || item.price < existing.price)) {
      byPair.set(key, item)
    }
  }

  return [...byPair.values()]
}

/**
 * Схлопывает одинаковые кузова одной модели.
 *
 * В источнике встречаются полностью повторяющиеся записи: у Kia Sorento
 * строка «фаркопы для Киа Соренто 1 BL 2006-2009» лежит дважды.
 * В схеме на пару (модель, слаг) стоит уникальный индекс, поэтому
 * без схлопывания импорт упадёт на вставке.
 *
 * Ключом служит именно слаг, а не исходное название: в базу уходит слаг,
 * и уникальность нужна по нему. Два разных названия, дающих один слаг,
 * тоже обязаны схлопнуться — иначе тот же уникальный индекс сработает.
 *
 * Возвращает оставшиеся кузова и карту «старый индекс → новый»,
 * по которой связки перенаправляются на сохранённую запись.
 */
export function dedupeVariants(
  list: RawVariant[],
  slugs: string[],
): {
  kept: RawVariant[]
  keptSlugs: string[]
  indexMap: Map<number, number>
} {
  const kept: RawVariant[] = []
  const keptSlugs: string[] = []
  const indexMap = new Map<number, number>()
  const newIndexByKey = new Map<string, number>()

  list.forEach((variant, oldIndex) => {
    const key = `${variant.modelIndex}:${slugs[oldIndex]}`
    const existing = newIndexByKey.get(key)

    if (existing !== undefined) {
      indexMap.set(oldIndex, existing)
      return
    }

    const newIndex = kept.length
    kept.push(variant)
    keptSlugs.push(slugs[oldIndex])
    newIndexByKey.set(key, newIndex)
    indexMap.set(oldIndex, newIndex)
  })

  return { kept, keptSlugs, indexMap }
}
