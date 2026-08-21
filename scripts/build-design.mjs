import { spawn } from 'node:child_process'

/**
 * Быстрая сборка для работы над дизайном.
 *
 * Ставит DESIGN_MODE=1 и запускает обычную сборку. Каталог тогда
 * выпускает по три страницы на маршрут вместо 8260 — секунды вместо
 * четырёх минут (см. src/catalog/build-scope.ts).
 *
 * Отдельный файл, а не переменная прямо в npm-скрипте: `VAR=1 next build`
 * не работает в PowerShell, а тянуть cross-env ради одной строки незачем.
 */
const child = spawn('npm', ['run', 'build'], {
  env: { ...process.env, DESIGN_MODE: '1' },
  stdio: 'inherit',
  shell: true,
})

child.on('exit', (code) => process.exit(code ?? 1))
