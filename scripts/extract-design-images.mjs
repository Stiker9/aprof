/**
 * Достаёт изображения из экспортов Claude Design.
 *
 * Картинки лежат не в разметке, а в манифесте бандла: тег
 * `<script type="__bundler/manifest">` с объектом, где на каждый uuid
 * приходится mime, флаг сжатия и base64. Часть записей пожата gzip.
 * Именно поэтому в самой странице стоят `blob:` — файлы собираются
 * на лету при загрузке.
 *
 * Исходники весят десятки мегабайт, поэтому каждая картинка проходит
 * через sharp: ужимается по ширине и пересохраняется в WebP.
 *
 * Имён у картинок в бандле нет, поэтому они складываются по порядку с
 * указанием размера — разбирать и переименовывать приходится глазами.
 *
 * Инструмент для разработки, в сборку сайта не входит.
 */
import { gunzipSync } from 'node:zlib'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_DIR = join(ROOT, 'design', 'extracted', 'export')
const OUT_DIR = join(ROOT, 'design', 'extracted', 'images')

/** Шире 1900 не нужно: страница ограничена 1400 плюс запас на экраны с удвоением. */
const MAX_WIDTH = 1900
const QUALITY = 82
/** Мельче — это иконки и шрифтовые сноски, фотографии нас интересуют. */
const MIN_WIDTH = 400

function readManifest(html) {
  const open = html.indexOf('<script type="__bundler/manifest">')
  if (open === -1) throw new Error('В файле нет манифеста бандла')
  const start = html.indexOf('{', open)
  const end = html.indexOf('</script>', start)
  return JSON.parse(html.slice(start, end).trim())
}

async function extractFrom(file) {
  const html = await readFile(join(SOURCE_DIR, file), 'utf8')
  const manifest = readManifest(html)

  const results = []
  let index = 0
  for (const [uuid, entry] of Object.entries(manifest)) {
    if (typeof entry?.mime !== 'string' || !entry.mime.startsWith('image/')) continue
    index += 1

    let bytes = Buffer.from(entry.data, 'base64')
    if (entry.compressed) bytes = gunzipSync(bytes)

    const image = sharp(bytes)
    const meta = await image.metadata()
    if (!meta.width || !meta.height || meta.width < MIN_WIDTH) continue

    const name = `${file.replace(/\.html$/, '')}-${String(index).padStart(2, '0')}.webp`
    const out = await image
      .resize({ width: Math.min(meta.width, MAX_WIDTH), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer()

    await writeFile(join(OUT_DIR, name), out)
    results.push(
      `  ${name} — ${meta.width}×${meta.height} ${entry.mime}, ` +
        `${Math.round(bytes.length / 1024)} КБ → ${Math.round(out.length / 1024)} КБ  (${uuid.slice(0, 8)})`,
    )
  }
  return results
}

const files = [
  '1-glavnaya.html',
  '2-katalog-podbor.html',
  '3-ustanovka.html',
  '4-kartochka-tovara.html',
]

await mkdir(OUT_DIR, { recursive: true })

for (const file of files) {
  const results = await extractFrom(file)
  console.log(`\n${file}: изображений ${results.length}`)
  for (const line of results) console.log(line)
}
