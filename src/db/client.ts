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

/**
 * Подключение кешируется на globalThis, а не в переменной модуля.
 *
 * В режиме разработки Next.js перезагружает модули на лету, и обычная
 * переменная обнулялась бы при каждой перезагрузке. Каждый раз создавался
 * бы новый экземпляр PGlite на той же папке, а файловую базу может держать
 * только один — второй падает с «RuntimeError: Aborted()».
 *
 * Кешируется обещание, а не готовое подключение: два одновременных вызова
 * до того, как первое успело открыться, иначе создали бы два экземпляра.
 */
const globalForDb = globalThis as typeof globalThis & {
  __autoprofiDb?: Promise<DrizzleDb>
}

/**
 * Подключение к БД. В режиме local поднимает PGlite в файле —
 * настоящий PostgreSQL в WASM, без установки сервера.
 * В режиме remote подключается к управляемому PostgreSQL.
 */
export function getDb(): Promise<DrizzleDb> {
  if (!globalForDb.__autoprofiDb) {
    globalForDb.__autoprofiDb = connect().catch((error: unknown) => {
      // Неудачу не кешируем: иначе одна ошибка при старте отравит
      // все последующие запросы до перезапуска процесса
      globalForDb.__autoprofiDb = undefined
      throw error
    })
  }
  return globalForDb.__autoprofiDb
}

async function connect(): Promise<DrizzleDb> {
  const mode = process.env.DATABASE_MODE ?? 'local'

  if (mode === 'remote') {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_MODE=remote, но DATABASE_URL не задан')
    return drizzlePostgres(postgres(url), { schema })
  }

  const dataDir = process.env.PGLITE_PATH ?? './.pgdata'
  return drizzlePglite(new PGlite(dataDir), { schema })
}

/**
 * Приводит результат db.execute() к массиву строк.
 *
 * Драйверы возвращают его по-разному: PGlite — объектом
 * { rows, fields, affectedRows }, postgres.js — массивоподобным значением.
 * Тип PgDatabase описывает результат как unknown, поэтому компилятор
 * эту разницу не поймает: код под один драйвер молча сломается на другом.
 *
 * На нераспознанной форме бросает ошибку, а не возвращает пустой массив.
 * Пустой массив здесь опаснее падения: запрос, вернувший список страниц,
 * молча дал бы ноль страниц, и сборка выпустила бы пустой сайт вместо
 * того, чтобы остановиться.
 */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  if (result !== null && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown }).rows
    if (Array.isArray(rows)) return rows as T[]
  }
  throw new Error(
    `Драйвер вернул результат неизвестной формы: ожидался массив строк или объект с полем rows, получено ${typeof result}`,
  )
}
