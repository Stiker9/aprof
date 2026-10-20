import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync, openSync } from 'node:fs'
import path from 'node:path'

/**
 * Запуск публикации из админки.
 *
 * ── Почему отдельным процессом, а не прямо в действии ──
 *
 * Публикация идёт от получаса: пересобрать 8 275 страниц, сравнить
 * отпечатки, отправить разницу. Серверное действие столько не живёт —
 * запрос оборвётся задолго до конца, а сборка окажется убита на
 * середине, оставив полвыгрузки.
 *
 * Поэтому действие только запускает отдельный процесс и сразу
 * отвечает. Процесс живёт сам по себе и пишет в журнал, а страница
 * смотрит в журнал и показывает, что происходит.
 *
 * ── Почему замок файлом ──
 *
 * Две одновременные публикации — это две сборки в одну папку и
 * гарантированно битая выгрузка. Замок лежит файлом, а не в памяти:
 * память живёт до перезапуска службы, а замок должен пережить его и
 * не дать запустить вторую сборку поверх идущей.
 *
 * В замке — номер процесса. Если процесса с таким номером уже нет,
 * замок считается брошенным: иначе упавшая сборка запирала бы
 * публикацию навсегда.
 */

const ROOT = process.cwd()
const DIR = path.join(ROOT, '.publish')
const LOCK = path.join(DIR, 'lock')
const LOG = path.join(DIR, 'publish.log')

export type PublishState =
  | { kind: 'idle'; log: string[] }
  | { kind: 'running'; log: string[] }
  | { kind: 'done'; log: string[]; ok: boolean }

/** Жив ли процесс с таким номером. */
function alive(pid: number): boolean {
  try {
    // Сигнал 0 ничего не делает, но падает, если процесса нет.
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function runningPid(): number | null {
  if (!existsSync(LOCK)) return null
  const pid = Number(readFileSync(LOCK, 'utf8').trim())
  if (!Number.isInteger(pid) || !alive(pid)) return null
  return pid
}

/** Последние строки журнала — их показывает страница публикаций. */
function tail(lines = 40): string[] {
  if (!existsSync(LOG)) return []
  return readFileSync(LOG, 'utf8').split('\n').filter(Boolean).slice(-lines)
}

export function publishState(): PublishState {
  const log = tail()
  if (runningPid() !== null) return { kind: 'running', log }
  if (log.length === 0) return { kind: 'idle', log }

  // Скрипт в конце печатает одну из двух строк. По ней и судим, чем
  // кончилось: код возврата отдельного процесса нам уже не виден.
  const ok = log.some((line) => line.includes('Сайт обновлён') || line.includes('заливать нечего'))
  return { kind: 'done', log, ok }
}

/**
 * Запускает публикацию, если она ещё не идёт.
 *
 * Процесс отвязывается от родителя: перезапуск админки не должен
 * убивать идущую сборку на середине.
 */
export function startPublish(): { started: boolean; reason?: string } {
  if (runningPid() !== null) return { started: false, reason: 'Публикация уже идёт' }

  mkdirSync(DIR, { recursive: true })
  const out = openSync(LOG, 'w')

  const child = spawn('npm', ['run', 'publish'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: process.env,
    shell: true,
  })

  if (child.pid === undefined) return { started: false, reason: 'Не удалось запустить процесс' }

  writeFileSync(LOCK, String(child.pid), 'utf8')
  child.unref()
  return { started: true }
}
