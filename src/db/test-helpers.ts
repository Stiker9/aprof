import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import * as schema from './schema'

/**
 * Поднимает PGlite в памяти и применяет ВСЕ SQL-миграции из drizzle/, а не
 * только первую найденную: миграции пронумерованы (0000_..., 0001_..., ...)
 * и должны применяться по порядку — иначе тесты будут проверять устаревшую
 * схему, не сообщив об этом. Файлы сортируются по имени, поэтому нумерация
 * гарантирует правильный порядок применения.
 */
export async function createTestDb() {
  const drizzleDir = path.resolve(__dirname, '../../drizzle')
  const migrationFiles = readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  if (migrationFiles.length === 0) {
    throw new Error('В drizzle/ не найдено ни одного файла миграции .sql')
  }

  const client = new PGlite()
  for (const file of migrationFiles) {
    const migration = readFileSync(path.join(drizzleDir, file), 'utf8')
    for (const stmt of migration.split('--> statement-breakpoint')) {
      if (stmt.trim()) await client.exec(stmt)
    }
  }

  return drizzle(client, { schema })
}
