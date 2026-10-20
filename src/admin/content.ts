import { eq } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { overrides } from '../db/schema'
import type { OverrideEntity } from './store'

/**
 * Правки владельца по разделам сайта — для показа в самой админке.
 *
 * Отличается от src/content/overrides.ts тем, откуда читает. Сайт
 * читает выложенный файл: он собран перед сборкой и показывает то,
 * что уже на витрине. Админка читает базу — там лежит и то, что ещё
 * не опубликовано.
 *
 * Разница принципиальная: если бы админка читала тот же файл, правка
 * пропадала бы из поля сразу после сохранения — до публикации её в
 * файле нет.
 */
export async function loadContentGroup(
  db: DrizzleDb,
  entity: OverrideEntity,
): Promise<Record<string, Record<string, string>>> {
  const rows = await db
    .select({
      targetKey: overrides.targetKey,
      field: overrides.field,
      value: overrides.value,
    })
    .from(overrides)
    .where(eq(overrides.entity, entity))

  const out: Record<string, Record<string, string>> = {}
  for (const row of rows) {
    // Служебная метка «пересобрать страницу» — не поле содержимого.
    if (row.field === '__dirty' || row.value === null) continue
    const bucket = out[row.targetKey] ?? (out[row.targetKey] = {})
    bucket[row.field] = row.value
  }
  return out
}
