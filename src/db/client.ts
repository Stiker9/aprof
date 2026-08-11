import { PGlite } from '@electric-sql/pglite'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Общий надтип для обоих драйверов. Объединение конкретных типов
 * здесь не годится: TypeScript не даст вызвать .execute() на union,
 * потому что сигнатуры драйверов различаются.
 */
export type DrizzleDb = PgDatabase<PgQueryResultHKT, typeof schema>

let cached: DrizzleDb | null = null

/**
 * Подключение к БД. В режиме local поднимает PGlite в файле —
 * настоящий PostgreSQL в WASM, без установки сервера.
 * В режиме remote подключается к управляемому PostgreSQL.
 */
export async function getDb(): Promise<DrizzleDb> {
  if (cached) return cached

  const mode = process.env.DATABASE_MODE ?? 'local'

  if (mode === 'remote') {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_MODE=remote, но DATABASE_URL не задан')
    cached = drizzlePostgres(postgres(url), { schema })
    return cached
  }

  const path = process.env.PGLITE_PATH ?? './.pgdata'
  const client = new PGlite(path)
  cached = drizzlePglite(client, { schema })
  return cached
}

/**
 * Приводит результат db.execute() к массиву строк.
 *
 * Драйверы возвращают его по-разному: PGlite — объектом
 * { rows, fields, affectedRows }, postgres.js — массивоподобным значением.
 * Тип PgDatabase описывает результат как unknown, поэтому компилятор
 * эту разницу не поймает: код под один драйвер молча сломается на другом.
 */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  if (result !== null && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown }).rows
    if (Array.isArray(rows)) return rows as T[]
  }
  return []
}
