/**
 * Сборка статической выгрузки для виртуального хостинга.
 *
 *   npm run build:static
 *
 * Делает то же, что обычная сборка, но с переменной STATIC_EXPORT=1 —
 * по ней next.config.ts включает режим `output: 'export'`. На выходе
 * папка `out` с готовыми файлами: сервер им не нужен.
 *
 * Отдельный скрипт, а не строка в package.json, по двум причинам.
 *
 * Переменную окружения нельзя задать в начале команды так, чтобы это
 * работало и в Windows, и в Linux: `VAR=1 next build` — синтаксис sh, а
 * npm на Windows запускает скрипты через cmd, где такая строка просто
 * ошибка. Обычно для этого ставят cross-env; ради одной переменной
 * тянуть зависимость незачем.
 *
 * И `prebuild` сюда не подтянется сам: npm запускает его только перед
 * скриптом с именем `build`. Разворачивание дампа базы нужно и здесь,
 * иначе на чистой машине сборка не найдёт товаров.
 *
 * Перед сборкой правки владельца из админки выкладываются в файл: сайт
 * читает их оттуда, а не из базы (см. scripts/apply-overrides.ts).
 *
 * После сборки идут два шага, без которых выгрузка неполна:
 * переименование файлов предзагрузки (см. flatten-prefetch.mjs) и
 * укладка .htaccess в корень. Оба легко забыть, если делать руками, а
 * последствия тихие: сайт работает, но сыплет 404 или теряет адреса.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'

/*
  Отдельная папка сборки: на сервере рядом работает админка со своей
  сборкой в .next, и класть выгрузку туда же значит затереть файлы
  работающего приложения прямо во время запроса. См. next.config.ts.
*/
/*
  Сюда Next кладёт готовый сайт. Служебные файлы сборки он при
  output: 'export' всё равно пишет в .next — в Next 16 это жёстко
  (build/index.js: config.distDir = '.next'). Поэтому на сервере админка
  работает не из .next, а из .next-admin (deploy/admin-server.md), иначе
  каждая публикация затирала бы её.
*/
const EXPORT_DIR = '.next-export'

/*
  Сборка читает не .pgdata, а её снимок. PGlite рассчитана на один
  процесс: пока рядом работает `next dev`, второй экземпляр на той же
  папке портит базу. Снимок снимает конфликт — разработку можно не
  останавливать на двадцать минут сборки. Правки владельца берутся из
  снимка так же, как из оригинала: на момент сборки они одинаковые.
*/
const SNAPSHOT = path.resolve('.pgdata-build')
rmSync(SNAPSHOT, { recursive: true, force: true })
process.on('exit', () => rmSync(SNAPSHOT, { recursive: true, force: true }))

/*
  Откуда снимок. Публикацию из админки предваряет выгрузка базы
  (PGLITE_SNAPSHOT_TGZ, см. src/admin/publish.ts) — это согласованная
  копия с правками владельца, её и разворачиваем. Просто скопировать
  папку работающей базы нельзя: снятая на ходу, она не открывается.

  Без выгрузки (запуск руками на машине разработчика) копируем папку:
  dev-сервер почти всё время только читает, и копия обычно цела.
*/
const ARCHIVE = process.env.PGLITE_SNAPSHOT_TGZ
if (ARCHIVE && existsSync(ARCHIVE)) {
  console.log('→ Разворачиваю выгрузку базы из админки')
  const loaded = spawnSync('node', ['scripts/load-snapshot.mjs', ARCHIVE, SNAPSHOT], {
    stdio: 'inherit',
    shell: true,
  })
  if (loaded.status !== 0) process.exit(loaded.status ?? 1)
} else if (existsSync('.pgdata')) {
  cpSync('.pgdata', SNAPSHOT, { recursive: true })
  rmSync(path.join(SNAPSHOT, 'postmaster.pid'), { force: true })
}

const env = {
  ...process.env,
  STATIC_EXPORT: '1',
  NEXT_DIST_DIR: '.next-export',
  PGLITE_PATH: SNAPSHOT,
  // Публикацию запускает админка, у которой эта переменная указывает на
  // настоящую базу (см. src/db/client.ts). Сборке нужен снимок.
  PGLITE_RUNTIME_PATH: '',
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('→ Разворачиваю базу, если её нет')
run('npx', ['tsx', 'scripts/restore-data.ts'])

console.log('→ Выкладываю правки владельца в data/content-overrides.json')
run('npx', ['tsx', 'scripts/apply-overrides.ts'])

console.log('→ Собираю статическую выгрузку')
run('npx', ['next', 'build'])

console.log('→ Чиню имена файлов предзагрузки')
run('node', ['scripts/flatten-prefetch.mjs', EXPORT_DIR])

console.log('→ Кладу .htaccess в корень выгрузки')
copyFileSync('deploy/.htaccess', `${EXPORT_DIR}/.htaccess`)

/*
  Готовая выгрузка переезжает в out/ — оттуда её берёт публикация. Next
  при своей папке сборки кладёт статику в неё, а не в out: пока шаги
  выше шли по out, они работали с прошлой выгрузкой, а новая оставалась
  без выровненных имён и без .htaccess.
*/
console.log('→ Переношу выгрузку в out/')
rmSync('out', { recursive: true, force: true })
moveExport()

/*
  На Windows переименование папки иногда отказывает с EPERM: свежие
  файлы ещё держит антивирус или индексатор поиска. Через секунду-две
  они отпускают, поэтому сначала несколько повторов, а если не вышло —
  копирование: дольше, но не зависит от чужих блокировок.
*/
function moveExport() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      renameSync(EXPORT_DIR, 'out')
      return
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'EBUSY') throw error
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500)
    }
  }
  console.log('   Папку не отпускают — копирую')
  cpSync(EXPORT_DIR, 'out', { recursive: true })
  rmSync(EXPORT_DIR, { recursive: true, force: true })
}

console.log('')
console.log('Готово. Файлы сайта — в папке out/')
