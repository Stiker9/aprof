import type { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Учёт применённых миграций.
 *
 * Раньше applyMigrations накатывала все файлы подряд и была неидемпотентна:
 * `CREATE TYPE` падает, если тип уже есть. Поэтому её вызывали только на
 * пустой базе — а на уже наполненной новые миграции накатить было нечем.
 * Это тихо: вторая миграция просто никогда не применялась, и код падал
 * на «relation "overrides" does not exist» где-то в середине сборки.
 */
const LEDGER = '_migrations'

/**
 * Какие миграции считать применёнными на базе, созданной до появления
 * учёта.
 *
 * Такие базы есть на руках: моя .pgdata и всё, что развёрнуто дампом до
 * этой правки. В них применена ровно одна миграция — 0000, других в
 * репозитории тогда не было. Поэтому её отмечаем применённой без
 * запуска, а всё остальное накатываем обычным порядком.
 *
 * Правило разовое и расширению не подлежит: у новых баз учёт ведётся с
 * первого запуска.
 */
const PRE_LEDGER = '0000_nosy_texas_twister.sql'

function migrationFiles(): string[] {
  const drizzleDir = path.resolve(__dirname, '../../drizzle')
  const files = readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    throw new Error('В drizzle/ не найдено ни одного файла миграции .sql')
  }
  return files
}

async function exists(client: PGlite, table: string): Promise<boolean> {
  const result = await client.query<{ yes: boolean }>(
    'select exists(select 1 from information_schema.tables where table_name = $1) as yes',
    [table],
  )
  return result.rows[0]?.yes === true
}

/**
 * Применяет миграции, которых ещё нет в базе. Возвращает имена
 * применённых — вызывающему есть что напечатать.
 *
 * Можно звать на любой базе: пустой, наполненной, уже обновлённой.
 * На обновлённой не делает ничего и возвращает пустой список.
 */
export async function applyMigrations(client: PGlite): Promise<string[]> {
  const files = migrationFiles()

  const hadLedger = await exists(client, LEDGER)
  await client.exec(`
    create table if not exists "${LEDGER}" (
      file text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  // Разовая отметка для баз, созданных до появления учёта: см. PRE_LEDGER.
  if (!hadLedger && (await exists(client, 'products'))) {
    await client.query(`insert into "${LEDGER}" (file) values ($1) on conflict do nothing`, [
      PRE_LEDGER,
    ])
  }

  const applied = new Set(
    (await client.query<{ file: string }>(`select file from "${LEDGER}"`)).rows.map((r) => r.file),
  )

  const fresh: string[] = []
  const drizzleDir = path.resolve(__dirname, '../../drizzle')

  for (const file of files) {
    if (applied.has(file)) continue

    const migration = readFileSync(path.join(drizzleDir, file), 'utf8')
    for (const statement of migration.split('--> statement-breakpoint')) {
      if (statement.trim()) await client.exec(statement)
    }

    // Отметка ставится после успешного применения: упавшая миграция
    // должна попробоваться снова, а не считаться выполненной.
    await client.query(`insert into "${LEDGER}" (file) values ($1)`, [file])
    fresh.push(file)
  }

  return fresh
}
