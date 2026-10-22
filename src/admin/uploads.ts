import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { Metadata, Sharp } from 'sharp'

/**
 * Приём картинок от владельца.
 *
 * ── Куда кладутся файлы ──
 *
 * `public/images/own/`. Отдельно от `public/images/products/`, куда
 * складывает снимки парсер заводов: если бы владелец загружал туда же,
 * следующий запуск парсера затёр бы его фотографию своей. Две папки
 * никогда не спорят за одно имя.
 *
 * Всё из `public` попадает в статическую выгрузку как есть, поэтому
 * загруженное уедет на сайт вместе со следующей сборкой — ничего
 * дополнительно переносить не нужно.
 *
 * ── Почему файл всегда пересохраняется через sharp ──
 *
 * Три причины, и каждой хватило бы.
 *
 * Снимок с телефона — это 4 МБ и 4000 пикселей по ширине. На витрине
 * он показывается в плитке шириной 800. Отдать посетителю исходник
 * значит потратить его трафик впятеро без всякой пользы.
 *
 * В JPEG с телефона лежит EXIF, а в нём — координаты съёмки. Снимок из
 * мастерской с её точными координатами ещё полбеды, а вот фотография,
 * сделанная дома, выдаст адрес владельца всему интернету. sharp
 * пересобирает файл и метаданные не переносит.
 *
 * И третье: «картинка» с расширением .jpg может оказаться чем угодно.
 * sharp разбирает её как изображение и на мусоре падает — то есть файл
 * до папки не доходит. Проверка по расширению такого не ловит.
 */

/** Папка загрузок внутри public. */
const DIR = path.join(process.cwd(), 'public', 'images', 'own')

/** Адрес, по которому файл виден на сайте. */
const URL_PREFIX = '/images/own'

/**
 * Потолок на исходник — 25 МБ.
 *
 * Снимок с телефона весит 3–6 МБ, с зеркалки — до 15. Двадцать пять
 * покрывает оба случая с запасом и при этом не даёт положить сервер
 * стомегабайтным файлом.
 */
const MAX_BYTES = 25 * 1024 * 1024

/**
 * Ширина на выходе — 1600.
 *
 * Больше, чем нужно плитке галереи (800), — намеренно: снимок
 * открывается в полный экран по нажатию, и там 800 заметно мылит на
 * ноутбуке. 1600 закрывает и это.
 */
const MAX_WIDTH = 1600
const QUALITY = 80

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

/**
 * HEIC — формат, в котором айфон сохраняет снимки по умолчанию.
 *
 * sharp из готовой сборки его не читает: кодек HEVC под патентами, и в
 * бинарники он не входит (в `sharp.format.heif` среди расширений только
 * .avif). Владелец загружал фото с айфона и получал «Не получилось
 * прочитать файл как изображение», хотя подсказка под кнопкой обещала
 * HEIC.
 *
 * Поэтому HEIC раскладывается в пиксели отдельным декодером (libheif,
 * собранный в WebAssembly — без системных библиотек), а дальше идёт
 * тем же путём через sharp, что и остальные форматы. Разворот по
 * ориентации libheif делает сам.
 *
 * Узнаём формат по содержимому, а не по типу из браузера: Windows не
 * знает MIME для .heic и присылает пустой тип.
 */
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'])

function isHeic(source: Buffer): boolean {
  if (source.length < 12 || source.subarray(4, 8).toString('latin1') !== 'ftyp') return false
  // mif1 бывает и у AVIF, но AVIF sharp читает сам — его не трогаем.
  const brand = source.subarray(8, 12).toString('latin1')
  return HEIC_BRANDS.has(brand) && !source.subarray(8, 64).toString('latin1').includes('avif')
}

async function decodeHeic(source: Buffer): Promise<Sharp> {
  const { default: decode } = await import('heic-decode')
  const { width, height, data } = await decode({ buffer: source })
  return sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
    raw: { width, height, channels: 4 },
  })
}

export interface UploadResult {
  /** Адрес файла для вставки в разметку. */
  url: string
  width: number
  height: number
  bytes: number
}

export class UploadError extends Error {}

/**
 * Сохраняет присланный файл и возвращает его адрес.
 *
 * `hint` попадает в имя файла, чтобы в папке можно было разобраться
 * глазами: `lada-largus-8f3a21.webp` понятнее, чем `8f3a21.webp`.
 * Случайный хвост обязателен — без него второй снимок той же машины
 * затёр бы первый, а старый адрес остался бы в кешах браузеров.
 */
export async function savePhoto(file: File, hint: string): Promise<UploadResult> {
  if (file.size === 0) throw new UploadError('Файл пустой')
  if (file.size > MAX_BYTES) {
    throw new UploadError(`Файл больше ${Math.round(MAX_BYTES / 1024 / 1024)} МБ`)
  }
  if (file.type && !ALLOWED.has(file.type)) {
    throw new UploadError('Нужна фотография: JPEG, PNG, WebP или HEIC')
  }

  const source = Buffer.from(await file.arrayBuffer())

  let image: Sharp
  let meta: Metadata
  try {
    // rotate() без аргументов разворачивает снимок по EXIF и снимает
    // саму метку. Без него вертикальные фотографии с телефона лежат
    // на боку: браузер на метку смотрит, а пересохранённый файл её уже
    // не несёт.
    image = isHeic(source) ? await decodeHeic(source) : sharp(source).rotate()
    meta = await image.metadata()
  } catch {
    throw new UploadError('Не получилось прочитать файл как изображение')
  }

  if (!meta.width || !meta.height) throw new UploadError('У файла не читается размер')

  const buffer = await image
    .resize(MAX_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer()

  const name = `${slugify(hint) || 'foto'}-${randomBytes(3).toString('hex')}.webp`

  await mkdir(DIR, { recursive: true })
  await writeFile(path.join(DIR, name), buffer)

  const out = await sharp(buffer).metadata()

  return {
    url: `${URL_PREFIX}/${name}`,
    width: out.width ?? 0,
    height: out.height ?? 0,
    bytes: buffer.length,
  }
}

/**
 * Латинский слаг из русского названия — только для имени файла.
 *
 * Таблица неполная по букве: здесь не транслитерация ради чтения, а
 * безопасное имя файла. Всё, чего нет в таблице, выбрасывается, и в
 * худшем случае останется случайный хвост.
 */
const RU: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .split('')
    .map((ch) => RU[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
