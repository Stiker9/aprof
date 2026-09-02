/**
 * Собирает из манифеста список, который читает сайт.
 *
 * Список закрытый и лежит в исходниках — ровно как у логотипов марок.
 * Строить путь прямо из slug нельзя: получились бы запросы к файлам,
 * которых нет, у 3 630 товаров из 5 808.
 *
 *   npx tsx scripts/images/generate.ts
 */
import { writeFile } from 'node:fs/promises'
import { readManifest } from './core/store'

const OUT = 'src/catalog/product-photos.ts'

async function main() {
  const manifest = await readManifest()
  const ready = Object.entries(manifest)
    .filter(([, record]) => record.approved)
    .map(([slug]) => slug)
    .sort()

  const bySource = new Map<string, number>()
  for (const [slug, record] of Object.entries(manifest)) {
    if (!record.approved) continue
    bySource.set(record.source, (bySource.get(record.source) ?? 0) + 1)
    void slug
  }

  const breakdown = [...bySource]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ` * - ${id}: ${count}`)
    .join('\n')

  const body = `/**
 * Товары, у которых есть своя картинка в public/images/products.
 *
 * Файл собирается скриптом: npx tsx scripts/images/generate.ts
 * Руками не править — правки затрёт следующий запуск.
 *
 * Источник каждой картинки записан в data/product-photos.json:
 * там для каждого артикула стоит адрес страницы завода, с которой она
 * взята. В список попадают только помеченные approved — то есть чертежи
 * и то, что просмотрено глазами.
 *
 * Сейчас в списке ${ready.length}:
${breakdown || ' * (пока пусто)'}
 */
export const PRODUCT_PHOTOS = new Set<string>([
${ready.map((slug) => `  '${slug}',`).join('\n')}
])

export function productPhotoSrc(slug: string): string | null {
  return PRODUCT_PHOTOS.has(slug) ? \`/images/products/\${slug}.webp\` : null
}
`

  await writeFile(OUT, body, 'utf8')
  console.log(`${OUT}: ${ready.length} товаров`)
  for (const [id, count] of bySource) console.log(`  ${id}: ${count}`)
}

void main()
