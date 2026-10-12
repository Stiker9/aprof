/**
 * Чинит файлы предзагрузки в статической выгрузке.
 *
 *   node scripts/flatten-prefetch.mjs out
 *
 * ── Что не так ──
 *
 * Next 16 кладёт данные для перехода между страницами вложенными
 * папками:
 *
 *   out/podbor/__next.podbor/__PAGE__.txt
 *   out/tovar/a101-a/__next.tovar/$d$article/__PAGE__.txt
 *
 * А браузер просит их плоским именем, где разделители — точки:
 *
 *   /podbor/__next.podbor.__PAGE__.txt
 *   /tovar/a101-a/__next.tovar.$d$article.__PAGE__.txt
 *
 * На сервере Next это несоответствие разруливает сам. В статической
 * выгрузке разруливать некому, и каждая такая просьба оборачивается
 * 404. В документации Next про эти файлы не сказано ничего — там
 * описано только правило для .html.
 *
 * ── Чем это грозит ──
 *
 * Сайт работает: не найдя данных, браузер просто перезагружает
 * страницу целиком. Но Next заранее запрашивает ссылки, попавшие в
 * видимую часть экрана, — на странице подбора это полсотни запросов,
 * и все впустую. Лишний расход на чужом хостинге и мусор в консоли.
 *
 * ── Что делает скрипт ──
 *
 * Переименовывает вложенные папки в плоские имена: склеивает путь
 * точками. Копий не создаёт — папки схлопываются в файлы, поэтому
 * число файлов не растёт, а немного падает.
 *
 * Запускается после `npm run build:static`, до заливки на хостинг.
 */
import { readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? 'out'

let moved = 0

/** Все файлы внутри папки, с путём относительно неё. */
function filesIn(dir, prefix = []) {
  const found = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) found.push(...filesIn(path, [...prefix, name]))
    else found.push({ path, segments: [...prefix, name] })
  }
  return found
}

/**
 * Сносит опустевшее дерево папок.
 *
 * Снизу вверх: после переименования внутри остаются вложенные пустые
 * папки, и проверка «в папке ничего нет» для верхней не срабатывает —
 * в ней лежит пустая дочерняя. Поэтому удаляем всё дерево разом, но
 * только убедившись, что файлов в нём не осталось.
 */
function removeEmptyTree(dir) {
  if (filesIn(dir).length > 0) return
  rmSync(dir, { recursive: true, force: true })
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (!statSync(path).isDirectory()) continue

    // Папка данных предзагрузки: всё внутри неё схлопывается в имя,
    // склеенное точками, и кладётся рядом с ней.
    if (name.startsWith('__next.')) {
      for (const file of filesIn(path)) {
        const flat = join(dir, [name, ...file.segments].join('.'))
        renameSync(file.path, flat)
        moved++
      }
      removeEmptyTree(path)
      continue
    }

    walk(path)
  }
}

walk(root)
console.log(`Файлов предзагрузки приведено к плоским именам: ${moved}`)
