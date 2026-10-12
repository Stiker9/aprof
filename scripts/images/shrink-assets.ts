/**
 * Ужимает крупные картинки оформления под статическую раздачу.
 *
 *   npx tsx scripts/images/shrink-assets.ts --dry
 *   npx tsx scripts/images/shrink-assets.ts
 *
 * ── Зачем ──
 *
 * На сервере Next сам подгонял картинку под экран: с телефона человек
 * получал уменьшенную копию, с большого монитора полную. На виртуальном
 * хостинге этого делать некому — там сервер умеет только отдавать файлы
 * как есть, и фон первого экрана в 2560 пикселей уезжает на телефон
 * целиком.
 *
 * Поэтому исходники приводятся к разумному потолку заранее.
 *
 * ── Откуда потолки ──
 *
 * Фон первого экрана — 1920. Это ширина самого ходового большого
 * монитора; на нём картинка ложится пиксель в пиксель. На 2560 будет
 * чуть мягче, но это несравнимо дешевле, чем 400 килобайт на каждом
 * телефоне. Прежние 2560 имели смысл, пока копии резал сервер.
 *
 * Фотографии работ — 800 по ширине. В галерее плитка 250–380 пикселей,
 * и 800 закрывает её с запасом даже на экране с двойной плотностью.
 *
 * Картинки товаров сюда не входят: они уже 800 и обработаны своим
 * скриптом (core/store.ts).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

interface Rule {
  dir: string
  maxWidth: number
  /** Какие файлы брать. Остальные в папке не трогаем. */
  match?: (file: string) => boolean
}

const RULES: Rule[] = [
  // Фоны и оформление лежат в корне папки images вперемешку с подпапками.
  { dir: 'public/images', maxWidth: 1920 },
  { dir: 'public/images/gallery', maxWidth: 800 },
]

const IMAGE = /\.(webp|jpe?g|png)$/i

async function main() {
  const dry = process.argv.includes('--dry')
  let before = 0
  let after = 0
  let touched = 0

  for (const rule of RULES) {
    for (const file of readdirSync(rule.dir)) {
      const path = join(rule.dir, file)
      if (!statSync(path).isFile() || !IMAGE.test(file)) continue
      if (rule.match && !rule.match(file)) continue

      // Файл читается в память целиком, а не отдаётся sharp путём.
      // sharp читает лениво и держит дескриптор открытым — на Windows
      // запись в тот же файл падает с «unable to open for write».
      const source = readFileSync(path)
      const meta = await sharp(source).metadata()
      if (!meta.width || meta.width <= rule.maxWidth) continue

      const sizeBefore = statSync(path).size
      before += sizeBefore

      const buffer = await sharp(source)
        .resize(rule.maxWidth, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()

      if (!dry) writeFileSync(path, buffer)
      after += buffer.length
      touched++

      console.log(
        `  ${file.padEnd(34)} ${meta.width}→${rule.maxWidth}  ` +
          `${Math.round(sizeBefore / 1024)} → ${Math.round(buffer.length / 1024)} КБ`,
      )
    }
  }

  console.log('')
  if (touched === 0) {
    console.log('Всё уже в пределах потолков — менять нечего.')
    return
  }
  console.log(
    `${dry ? 'Будет ужато' : 'Ужато'} ${touched} шт.: ` +
      `${Math.round(before / 1024)} → ${Math.round(after / 1024)} КБ ` +
      `(минус ${Math.round((1 - after / before) * 100)}%)`,
  )
}

void main()
