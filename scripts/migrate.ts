import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { applyMigrations } from '../src/db/migrate'

/**
 * Накатывает миграции на локальную базу.
 *
 *   npm run migrate
 *
 * Нужен после `drizzle-kit generate`: сама генерация только пишет файл
 * в drizzle/, базу она не трогает. Сборка накатывает миграции сама (см.
 * restore-data.ts), но ждать сборки, чтобы проверить новую таблицу в
 * режиме разработки, незачем.
 */
const DB_PATH = process.env.PGLITE_PATH || path.resolve(__dirname, '..', '.pgdata')

async function main() {
  const client = new PGlite(DB_PATH)
  const fresh = await applyMigrations(client)

  console.log(
    fresh.length === 0 ? 'Нечего применять — база на последней схеме.' : `Применено:\n  ${fresh.join('\n  ')}`,
  )

  await client.close()
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
