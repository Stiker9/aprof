import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { markPublished, pendingCount } from '../src/admin/store'
import * as schema from '../src/db/schema'

/**
 * Отмечает накопленные правки опубликованными.
 *
 * Вызывается скриптом публикации ПОСЛЕ успешной заливки, своим
 * процессом — отдельно потому, что publish.mjs это обычный js без
 * TypeScript, а схема базы описана типами.
 *
 * Руками запускать не надо: отметка без заливки означает «правки на
 * сайте», которых там нет.
 */
const DB_PATH = process.env.PGLITE_PATH || path.resolve(__dirname, '..', '.pgdata')

async function main() {
  const client = new PGlite(DB_PATH)
  const db = drizzle(client, { schema })

  const before = await pendingCount(db)
  await markPublished(db)

  console.log(before === 0 ? 'Непубликованных правок не было.' : `Отмечено опубликованными: ${before}`)
  await client.close()
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
