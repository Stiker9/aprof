import { gzipSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { getDb } from '../src/db/client'
import * as schema from '../src/db/schema'

/**
 * Выгружает каталог в сжатый файл, который лежит в репозитории.
 *
 * Зачем это нужно. Сама база — папка PGlite на 65 мегабайт двоичных
 * файлов, в git её класть нельзя: она меняется целиком при любой
 * правке и раздует историю за десяток коммитов. Но без данных сборка
 * невозможна — 8 260 страниц берутся из базы, и на чужой машине
 * (Vercel, CI, новый разработчик) сборка падает на первом же запросе
 * с «relation "variants" does not exist».
 *
 * Поэтому в репозиторий едет не база, а её содержимое: шесть таблиц
 * в JSON под gzip. Перед сборкой scripts/restore-data.ts разворачивает
 * их обратно в пустую PGlite.
 *
 * Запускать после каждого обновления каталога, иначе на проде окажется
 * старый срез.
 */
const TABLES = {
  manufacturers: schema.manufacturers,
  brands: schema.brands,
  models: schema.models,
  variants: schema.variants,
  products: schema.products,
  fitments: schema.fitments,
} as const

const OUT = path.resolve(__dirname, '..', 'data', 'catalog.json.gz')

async function main() {
  const db = await getDb()
  const dump: Record<string, unknown[]> = {}

  for (const [name, table] of Object.entries(TABLES)) {
    const rows = await db.select().from(table)
    dump[name] = rows
    console.log(`${name.padEnd(16)} ${String(rows.length).padStart(6)} строк`)
  }

  const json = JSON.stringify(dump)
  const packed = gzipSync(json, { level: 9 })

  mkdirSync(path.dirname(OUT), { recursive: true })
  writeFileSync(OUT, packed)

  const mb = (n: number) => (n / 1024 / 1024).toFixed(2)
  console.log(`\nJSON  ${mb(Buffer.byteLength(json))} МБ`)
  console.log(`gzip  ${mb(packed.length)} МБ → data/catalog.json.gz`)

  // PGlite держит открытым воркер WASM, и без явного выхода процесс
  // висит после успешной работы — Node не завершается сам.
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
