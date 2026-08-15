/**
 * Раздаёт папку макетов по HTTP.
 *
 * Экспорты из Claude Design — React-бандлы: по `file://` они не
 * запускаются, а без запуска в файле нет ничего, кроме заглушки.
 * Поднятые по HTTP, они рендерятся, и раскладку можно снять с DOM
 * вместо того, чтобы пересказывать её по памяти.
 *
 * Инструмент для разработки, в сборку сайта не входит.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design', 'extracted', 'export')
const PORT = 4300

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

createServer(async (req, res) => {
  const requested = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(
    /^[\\/]+/,
    '',
  )
  const file = join(ROOT, requested || 'index.html')

  // Без этой проверки `../..` в адресе отдаёт любой файл на диске.
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403).end('forbidden')
    return
  }

  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, () => {
  console.log(`Макеты на http://localhost:${PORT} — файлы по именам, например /2-katalog-podbor.html`)
})
