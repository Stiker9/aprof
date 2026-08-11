import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { applyMigrations } from './migrate'
import * as schema from './schema'

/** Поднимает чистую базу в памяти с применённой схемой — для тестов. */
export async function createTestDb() {
  const client = new PGlite()
  await applyMigrations(client)
  return drizzle(client, { schema })
}
