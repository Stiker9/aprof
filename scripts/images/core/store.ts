/**
 * Хранилище картинок товаров.
 *
 * Оригиналы у заводов бывают по 4000 пикселей и полмегабайта — на
 * плитку каталога такое класть нельзя. Всё приводится к webp шириной не
 * больше 1000: плитка показывает картинку в 260 пикселей, крупный кадр
 * в карточке — в 700, запас на плотные экраны заложен.
 *
 * Рядом с файлами лежит манифест. В нём для каждого артикула записано,
 * откуда картинка взята и что это за сорт, — без этого через полгода
 * будет не ответить на вопрос «а откуда у нас вот это изображение».
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import type { ImageKind } from './classify'

export const PHOTO_DIR = 'public/images/products'

/**
 * Манифест лежит вне public.
 *
 * В public его класть нельзя: всё оттуда раздаётся наружу, и учётная
 * запись со ссылками на страницы заводов оказалась бы опубликована на
 * боевом сайте вместе с картинками.
 */
const MANIFEST = 'data/product-photos.json'

/**
 * Шире не имеет смысла: самое крупное место показа — 700 пикселей,
 * плитка каталога и вовсе 260.
 *
 * Было 1000 при качестве 84 — четыре тысячи файлов весили 206 МБ, и
 * это уходило в репозиторий навсегда. На 800 и 80 выходит вдвое
 * меньше, а разницы на экране нет.
 */
const MAX_WIDTH = 800
const QUALITY = 80

export interface PhotoRecord {
  /** Артикул как в нашей базе. */
  article: string
  /** Имя файла в public/images/products. */
  file: string
  /** Адаптер, который её нашёл. */
  source: string
  /** Страница товара на сайте завода — доказательство происхождения. */
  page: string
  /** Адрес оригинала. */
  origin: string
  kind: ImageKind
  width: number
  height: number
  /** Числа, по которым классификатор принял решение, — чтобы спор был предметным. */
  colours: number
  entropy: number
  /**
   * Просмотрена ли картинка человеком.
   *
   * Чертежи выкладываются сразу, всё остальное ждёт: на фотографиях в
   * кадр попадают чужие номера и телефоны автосалонов.
   */
  approved: boolean
}

export type Manifest = Record<string, PhotoRecord>

export async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf8')) as Manifest
  } catch {
    return {}
  }
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  await mkdir('data', { recursive: true })
  const sorted: Manifest = {}
  for (const key of Object.keys(manifest).sort()) sorted[key] = manifest[key]
  await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
}

/**
 * Кладёт картинку под артикул и возвращает имя файла.
 *
 * Имя — slug артикула, тот же, что в адресе товара: так по файлу видно,
 * чей он, и совпадения имён невозможны — slug у товара уникален.
 */
export async function savePhoto(slug: string, data: Buffer): Promise<string> {
  await mkdir(PHOTO_DIR, { recursive: true })
  const file = `${slug}.webp`
  const image = sharp(data).flatten({ background: '#ffffff' })
  const meta = await image.metadata()
  const resized =
    meta.width && meta.width > MAX_WIDTH ? image.resize(MAX_WIDTH, null, { fit: 'inside' }) : image
  await resized.webp({ quality: QUALITY }).toFile(join(PHOTO_DIR, file))
  return file
}
