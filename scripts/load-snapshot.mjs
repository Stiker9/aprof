/**
 * Разворачивает выгрузку базы PGlite (dumpDataDir) в папку.
 *
 *   node scripts/load-snapshot.mjs <выгрузка.tar.gz> <папка>
 *
 * Выгрузку делает админка перед публикацией (src/admin/publish.ts), а
 * сборка сайта читает развёрнутую копию — к базе работающей админки она
 * не прикасается.
 */
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const [archive, dir] = process.argv.slice(2)
if (!archive || !dir) {
  console.error('Нужно: node scripts/load-snapshot.mjs <выгрузка.tar.gz> <папка>')
  process.exit(1)
}

const db = new PGlite(dir, { loadDataDir: new Blob([readFileSync(archive)]) })
const { rows } = await db.query('select count(*)::int as n from products')
await db.close()

console.log(`Снимок базы развёрнут: ${rows[0].n} товаров`)
