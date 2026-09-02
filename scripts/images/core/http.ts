/**
 * Вежливый загрузчик страниц и файлов.
 *
 * Три правила, которые здесь зашиты намертво:
 *
 * 1. Пауза между запросами к одному хосту. Мы берём картинки у заводов,
 *    чьи изделия продаём, — заваливать их сервер запросами нельзя.
 *    По умолчанию секунда; для больших каталогов это часы, и это
 *    нормально, парсер запускается раз в жизни товара.
 *
 * 2. Кэш на диске. Повторный прогон не трогает чужой сервер вовсе:
 *    страница читается из .cache. Без этого отладка адаптера означала бы
 *    сотни лишних запросов.
 *
 * 3. Честный User-Agent с адресом сайта. Владелец сервера должен иметь
 *    возможность понять, кто пришёл, и написать нам, если он против.
 *    Маскироваться под браузер — значит заранее считать, что делаешь
 *    что-то, чего делать не следует.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const CACHE_DIR = '.cache/images'

// Только латиница: заголовки HTTP — это ByteString, кириллица в них
// роняет fetch ещё до отправки запроса.
const USER_AGENT =
  'AutoprofiCatalogBot/1.0 (+https://autoprofi.spb.ru; product images for a towbar shop)'

/** Когда последний раз стучались к хосту — чтобы выдержать паузу. */
const lastHit = new Map<string, number>()

export interface FetchOptions {
  /** Пауза между запросами к одному хосту, мс. */
  delayMs?: number
  /** Страница, с которой пришли: некоторые сервера без него отдают заглушку. */
  referer?: string
  /** Не читать из кэша, сходить заново. */
  fresh?: boolean
}

function cachePath(url: string, ext: string): string {
  const hash = createHash('sha1').update(url).digest('hex')
  const host = new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '_')
  return join(CACHE_DIR, host, `${hash}.${ext}`)
}

async function readCache(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path)
  } catch {
    return null
  }
}

async function writeCache(path: string, data: Buffer): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, data)
}

async function throttle(url: string, delayMs: number): Promise<void> {
  const host = new URL(url).hostname
  const previous = lastHit.get(host) ?? 0
  const wait = previous + delayMs - Date.now()
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastHit.set(host, Date.now())
}

/**
 * Скачивает адрес, отдавая тело как есть.
 *
 * Три попытки: чужие сайты роняют соединение чаще, чем возвращают
 * честную ошибку, и один обрыв не повод терять карточку.
 */
export async function fetchBuffer(url: string, options: FetchOptions = {}): Promise<Buffer | null> {
  const { delayMs = 1000, referer, fresh = false } = options
  const path = cachePath(url, 'bin')

  if (!fresh) {
    const cached = await readCache(path)
    if (cached) return cached
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    await throttle(url, delayMs)
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': USER_AGENT,
          accept: '*/*',
          ...(referer ? { referer } : {}),
        },
        redirect: 'follow',
      })
      if (!response.ok) {
        // 404 — товара нет, повторять бессмысленно. Остальное пробуем ещё раз.
        if (response.status === 404 || response.status === 410) return null
        throw new Error(`HTTP ${response.status}`)
      }
      const data = Buffer.from(await response.arrayBuffer())
      await writeCache(path, data)
      return data
    } catch (error) {
      if (attempt === 3) {
        console.warn(`  ! не скачалось: ${url} — ${(error as Error).message}`)
        return null
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
    }
  }
  return null
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<string | null> {
  const data = await fetchBuffer(url, options)
  return data ? data.toString('utf8') : null
}
