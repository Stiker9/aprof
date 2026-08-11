import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { applyMigrations } from '../src/db/migrate'
import * as schema from '../src/db/schema'
import { importCatalog } from '../src/import/run'

const SOURCE = 'E:/всякое/WEB/Подбор_фаркопов_все_марки_инструкции_сертификаты.html'
const DB_PATH = process.env.PGLITE_PATH ?? './.pgdata'

async function main() {
  console.log('Очищаю старую базу…')
  await rm(DB_PATH, { recursive: true, force: true })

  console.log('Применяю схему…')
  const client = new PGlite(DB_PATH)
  await applyMigrations(client)
  const db = drizzle(client, { schema })

  console.log('Читаю исходный файл…')
  const html = readFileSync(SOURCE, 'utf8')

  console.log('Импортирую…')
  const started = Date.now()
  const stats = await importCatalog(html, db)
  const seconds = ((Date.now() - started) / 1000).toFixed(1)

  console.log('')
  console.log('Производители:', stats.manufacturers)
  console.log('Марки:        ', stats.brands)
  console.log('Модели:       ', stats.models)
  console.log('Кузова:       ', stats.variants)
  console.log('Товары:       ', stats.products)
  console.log('Связки:       ', stats.fitments)
  console.log('')
  console.log(`Импорт занял ${seconds} с`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
