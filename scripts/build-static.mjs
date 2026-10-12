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
 * После сборки идут два шага, без которых выгрузка неполна:
 * переименование файлов предзагрузки (см. flatten-prefetch.mjs) и
 * укладка .htaccess в корень. Оба легко забыть, если делать руками, а
 * последствия тихие: сайт работает, но сыплет 404 или теряет адреса.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'

const env = { ...process.env, STATIC_EXPORT: '1' }

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('→ Разворачиваю базу, если её нет')
run('npx', ['tsx', 'scripts/restore-data.ts'])

console.log('→ Собираю статическую выгрузку')
run('npx', ['next', 'build'])

console.log('→ Чиню имена файлов предзагрузки')
run('node', ['scripts/flatten-prefetch.mjs', 'out'])

console.log('→ Кладу .htaccess в корень выгрузки')
copyFileSync('deploy/.htaccess', 'out/.htaccess')

console.log('')
console.log('Готово. Файлы сайта — в папке out/')
