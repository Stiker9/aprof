import { existsSync } from 'node:fs'
import path from 'node:path'
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
  __vashfarkopDb?: Promise<DrizzleDb>
}

/**
 * Подключение к БД. В режиме local поднимает PGlite в файле —
 * настоящий PostgreSQL в WASM, без установки сервера.
 * В режиме remote подключается к управляемому PostgreSQL.
 *
 * ── Писать в .pgdata может только один процесс ──
 *
 * Пока запущен `npm run dev`, базу держит он. Любой скрипт, открывший
 * .pgdata вторым экземпляром PGlite, работает со своей копией данных:
 * его записи до сервера не доходят, а сервер продолжает показывать
 * то, что помнит сам. Выглядит это как «правка сохранилась, но не
 * видна» или «удалил, а оно осталось» — ошибки при этом нет.
 *
 * Правило простое: перед запуском scripts/*.ts, которые пишут в базу,
 * сервер разработки надо остановить.
 */
export function getDb(): Promise<DrizzleDb> {
  if (!globalForDb.__vashfarkopDb) {
    globalForDb.__vashfarkopDb = connect().catch((error: unknown) => {
      // Неудачу не кешируем: иначе одна ошибка при старте отравит
      // все последующие запросы до перезапуска процесса
      globalForDb.__vashfarkopDb = undefined
      throw error
    })
  }
  return globalForDb.__vashfarkopDb
}

async function connect(): Promise<DrizzleDb> {
  const mode = process.env.DATABASE_MODE ?? 'local'

  if (mode === 'remote') {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_MODE=remote, но DATABASE_URL не задан')
    return drizzlePostgres(postgres(url), { schema })
  }

  /*
    Абсолютный путь, не './.pgdata' — тот резолвился относительно
    process.cwd() того процесса, который его открывает, а «Collecting page
    data» у Next.js исполняется в отдельном воркере, чей cwd не гарантированно
    совпадает с тем, откуда запускался npm run prebuild. На чужой машине это
    приводило к тихому созданию новой пустой PGlite-базы вместо развёрнутой —
    и падению с «relation "variants" does not exist» при первом же запросе.
    PGLITE_PATH теперь приходит уже абсолютным из next.config.ts (env),
    но explicit path.resolve() — на случай прямого запуска без Next.js.
  */
  const dataDir = process.env.PGLITE_PATH || path.resolve(process.cwd(), '.pgdata')

  // Строка сборки, не рантайма сайта — безопасно логировать всегда.
  console.log(`[db] cwd=${process.cwd()} dataDir=${dataDir} существует=${existsSync(dataDir)}`)

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
