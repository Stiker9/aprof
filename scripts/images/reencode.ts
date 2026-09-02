/**
 * Пересобирает все картинки товаров из оригиналов.
 *
 *   npx tsx scripts/images/reencode.ts
 *
 * Нужен, когда меняются размер или качество в core/store.ts. Пережимать
 * уже сохранённый webp нельзя — это сжатие поверх сжатия, и следы
 * первого прохода останутся навсегда. Поэтому оригиналы берутся из
 * кэша парсера по адресу, записанному в манифесте.
 *
 * Сеть при этом не трогается вовсе: всё, что скачивалось, лежит в
 * .cache/images. Если кэш почищен, файл пропускается и остаётся
 * прежним — заново качать четыре тысячи картинок с чужих серверов
 * только ради перепаковки не годится.
 */
import { fetchBuffer } from './core/http'
import { readManifest, savePhoto } from './core/store'

async function main() {
  const manifest = await readManifest()
  const rows = Object.entries(manifest)
  console.log(`Пересобираю ${rows.length} картинок из оригиналов…`)

  let done = 0
  let missing = 0

  for (const [slug, record] of rows) {
    // Сеть не дёргаем: нужен только кэш. Если его нет — пропускаем.
    const data = await fetchBuffer(record.origin, { delayMs: 0 })
    if (!data) {
      missing++
      continue
    }
    await savePhoto(slug, data)
    done++
    if (done % 500 === 0) console.log(`  … ${done}`)
  }

  console.log(`Готово: пересобрано ${done}, оригинал не нашёлся у ${missing}`)
}

void main()
