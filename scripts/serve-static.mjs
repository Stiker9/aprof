/**
 * Локальная проверка статической выгрузки.
 *
 *   node scripts/serve-static.mjs        → http://localhost:4400
 *
 * Поднимает папку `out` так же, как её отдаст виртуальный хостинг:
 * обычный файловый сервер, никакого Next. Это единственный способ
 * убедиться, что сайт работает без сервера, — dev-сервер тут не
 * показатель, он слишком многое делает сам.
 *
 * Повторяет два правила из deploy/.htaccess, иначе проверка идёт не на
 * том, что будет на хостинге:
 *
 * 1. Адрес без расширения отдаёт одноимённый .html. На хостинге это
 *    делает mod_rewrite, здесь — пара строк ниже.
 * 2. Несуществующий адрес отдаёт 404.html с кодом 404, а не пустоту.
 *
 * Перенаправления с www и .online не воспроизводятся: они про домены,
 * а локально домен один.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const ROOT = 'out'
const PORT = 4400

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
}

/** Какой файл отдать на этот адрес. null — не нашли. */
function resolve(urlPath) {
  // Защита от выхода за пределы папки: нормализуем и отсекаем «..».
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  const candidates = [
    join(ROOT, clean),
    join(ROOT, `${clean}.html`),
    join(ROOT, clean, 'index.html'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

createServer((request, response) => {
  const file = resolve(request.url === '/' ? '/index.html' : request.url)

  if (!file) {
    const notFound = join(ROOT, '404.html')
    response.writeHead(404, { 'content-type': TYPES['.html'] })
    if (existsSync(notFound)) createReadStream(notFound).pipe(response)
    else response.end('404')
    return
  }

  response.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
  })
  createReadStream(file).pipe(response)
}).listen(PORT, () => {
  console.log(`Статическая выгрузка: http://localhost:${PORT}`)
})
