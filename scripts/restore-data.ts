import { gunzipSync } from 'node:zlib'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { applyMigrations } from '../src/db/migrate'
import * as schema from '../src/db/schema'

/**
 * Разворачивает дамп data/catalog.json.gz в пустую базу перед сборкой.
 *
 * Зачем это отдельный шаг, а не часть getDb(). База нужна на сборке,
 * а не в рантайме — все страницы статические. Разворачивать дамп при
 * каждом обращении к getDb() было бы неверно: в разработке getDb()
 * дёргается на каждый hot-reload, и накатывать 20 тысяч строк на
 * каждый — медленно и незачем, там уже есть живая .pgdata/.
 * Разворачивать нужно ровно один раз — на чистой машине (Vercel, CI,
 * новый разработчик), где .pgdata/ ещё не существует.
 *
 * Открывает PGlite напрямую, как scripts/import.ts, а не через
 * getDb(): getDb() при первом обращении может закешировать
 * подключение к ещё пустой, без миграций, базе, и этот кеш незачем
 * ворошить ради разового скрипта.
 */
const DUMP = path.resolve(__dirname, '..', 'data', 'catalog.json.gz')
/**
 * Абсолютный путь, а не относительный './.pgdata' — см. объяснение в
 * next.config.ts (env.PGLITE_PATH). Оба места обязаны сойтись на одном и
 * том же каталоге вне зависимости от того, откуда запущен процесс.
 */
const DB_PATH = process.env.PGLITE_PATH || path.resolve(__dirname, '..', '.pgdata')

/** Порядок важен: сперва таблицы, на которые ссылаются внешние ключи. */
const ORDER = [
  ['manufacturers', schema.manufacturers],
  ['brands', schema.brands],
  ['models', schema.models],
  ['variants', schema.variants],
  ['products', schema.products],
  ['fitments', schema.fitments],
] as const

/**
 * PostgreSQL не примет больше 65535 параметров на запрос. У products
 * по 16 колонок, и партия на все 5808 строк разом превысила бы лимит
 * в несколько раз — та же причина, что и в src/import/run.ts.
 */
const CHUNK_SIZE = 500

async function main() {
  if (!existsSync(DUMP)) {
    throw new Error(
      `Нет файла ${DUMP}. Сначала выполните npm run export-data на машине, где база уже наполнена импортом.`,
    )
  }

  const client = new PGlite(DB_PATH)
  const db = drizzle(client, { schema })

  /*
    Миграции применяются, только если таблиц ещё нет. applyMigrations
    не идемпотентна — `CREATE TYPE` в ней падает, если тип уже
    существует, — а на машине разработчика .pgdata/ приходит уже
    наполненной из npm run import. Без этой проверки обычный
    `npm run build` у любого, кто уже импортировал каталог, стал бы
    падать на первом же шаге.
  */
  const [{ exists: hasTables }] = (
    await db.execute(
      sql`select exists(select 1 from information_schema.tables where table_name = 'products') as exists`,
    )
  ).rows as { exists: boolean }[]

  if (!hasTables) {
    await applyMigrations(client)
  }

  const [{ count }] = (
    await db.execute(sql`select count(*)::int as count from products`)
  ).rows as { count: number }[]

  if (count > 0) {
    console.log(`В базе уже ${count} товаров — разворачивание дампа пропущено.`)
    await client.close()
    return
  }

  const packed = readFileSync(DUMP)
  const dump = JSON.parse(gunzipSync(packed).toString('utf8')) as Record<string, unknown[]>

  for (const [name, table] of ORDER) {
    const rows = dump[name]
    if (!rows) throw new Error(`В дампе нет таблицы ${name}`)
    if (rows.length === 0) continue

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.insert(table as any).values(chunk)
    }

    // Дамп несёт свои id — следующий serial обязан продолжить с
    // максимума, иначе первая же запись мимо этого скрипта столкнётся
    // с уже занятым id.
    await db.execute(
      sql.raw(
        `select setval(pg_get_serial_sequence('${name}', 'id'), coalesce((select max(id) from ${name}), 1))`,
      ),
    )

    console.log(`${name.padEnd(16)} ${String(rows.length).padStart(6)} строк`)
  }

  console.log('\nБаза развёрнута из дампа.')
  await client.close()
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
