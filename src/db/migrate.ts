import type { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Применяет ВСЕ SQL-миграции из drizzle/, а не только первую найденную.
 *
 * Миграции пронумерованы (0000_…, 0001_…), сортировка по имени задаёт
 * правильный порядок. Применять одну первую нельзя: тогда база молча
 * останется на устаревшей схеме, не сообщив об этом.
 *
 * Отсутствие миграций — это ошибка, а не пустая работа: значит,
 * забыли выполнить `drizzle-kit generate`.
 */
export async function applyMigrations(client: PGlite): Promise<void> {
  const drizzleDir = path.resolve(__dirname, '../../drizzle')
  const files = readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    throw new Error('В drizzle/ не найдено ни одного файла миграции .sql')
  }

  for (const file of files) {
    const migration = readFileSync(path.join(drizzleDir, file), 'utf8')
    for (const statement of migration.split('--> statement-breakpoint')) {
      if (statement.trim()) await client.exec(statement)
    }
  }
}
