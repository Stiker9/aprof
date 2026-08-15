/**
 * Переносит картинки из исходников макета в public.
 *
 * Исходники лежат в design/source/assets: два кадра первого экрана в PNG
 * по полтора-три мегабайта и логотипы марок. В таком виде на сайт им
 * нельзя — фотографии пересохраняются в WebP, логотипы тоже, но с
 * сохранением прозрачности.
 *
 * Логотипы уходят под именами, совпадающими с адресами марок в каталоге:
 * так страница марки находит свой файл без таблицы соответствий.
 *
 * Инструмент для разработки, в сборку сайта не входит.
 */
import { readdir, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'design', 'source', 'assets')
const OUT = join(ROOT, 'public', 'images')
const OUT_LOGOS = join(OUT, 'logos')

/** Фотографии первого экрана: шире 2200 не нужно даже на экранах с удвоением. */
const PHOTOS = {
  'hero-farkop-dark.png': { name: 'hero-farkop.webp', width: 2200, quality: 80 },
  'hero-prado-piter.png': { name: 'hero-prado.webp', width: 2200, quality: 80 },
  'odin-vizit.png': { name: 'odin-vizit.webp', width: 2200, quality: 80 },
}

/** Логотип показывается в ячейке около 80 пикселей — 200 хватает с запасом. */
const LOGO_WIDTH = 200

async function convertPhotos() {
  const done = []
  for (const [file, opts] of Object.entries(PHOTOS)) {
    const image = sharp(join(SRC, file))
    const meta = await image.metadata()
    const info = await image
      .resize({ width: Math.min(meta.width ?? opts.width, opts.width), withoutEnlargement: true })
      .webp({ quality: opts.quality })
      .toFile(join(OUT, opts.name))
    done.push(`  ${opts.name} — ${meta.width}×${meta.height} → ${Math.round(info.size / 1024)} КБ`)
  }
  return done
}

async function convertLogos() {
  const files = (await readdir(join(SRC, 'logos'))).filter((f) => f.endsWith('.png'))
  const done = []
  for (const file of files) {
    const name = file.replace(/\.png$/, '.webp')
    const info = await sharp(join(SRC, 'logos', file))
      .resize({ width: LOGO_WIDTH, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(join(OUT_LOGOS, name))
    done.push(`${name} ${Math.round(info.size / 1024)}КБ`)
  }
  return done
}

await mkdir(OUT, { recursive: true })
await mkdir(OUT_LOGOS, { recursive: true })

const photos = await convertPhotos()
console.log(`Фотографии: ${photos.length}`)
for (const line of photos) console.log(line)

const logos = await convertLogos()
console.log(`\nЛоготипы: ${logos.length}`)
console.log('  ' + logos.join(', '))
