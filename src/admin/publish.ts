import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync, openSync, rmSync } from 'node:fs'
import path from 'node:path'
import { getDb } from '@/db/client'
import { markPublished } from './store'

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
const SNAPSHOT = path.join(DIR, 'pgdata.tar.gz')
/** Когда снималась база для сборки — граница для отметки «опубликовано». */
const STARTED = path.join(DIR, 'started')
/** Отметка уже поставлена для этой публикации. */
const MARKED = path.join(DIR, 'marked')

/**
 * Выгрузка базы для сборки.
 *
 * Сборке нужны правки владельца, а они в базе работающей админки.
 * Открыть ту же папку второй копией PGlite нельзя — она держит один
 * процесс. Скопировать файлы тоже: снятая на ходу копия не согласована
 * и не открывается («Aborted()»). Поэтому базу выгружает сама админка
 * встроенным dumpDataDir — это согласованный снимок, — а сборка
 * разворачивает его в свою папку (scripts/build-static.mjs).
 */
async function dumpDatabase(): Promise<boolean> {
  const db = await getDb()
  const client = (db as unknown as { $client?: { dumpDataDir?: (c: 'gzip') => Promise<Blob> } })
    .$client
  if (typeof client?.dumpDataDir !== 'function') return false
  const blob = await client.dumpDataDir('gzip')
  writeFileSync(SNAPSHOT, Buffer.from(await blob.arrayBuffer()))
  return true
}

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

/**
 * Отмечает правки опубликованными, когда публикация дошла до конца.
 *
 * Раньше отметку ставил скрипт публикации своим процессом. Но база
 * PGlite держит один процесс: скрипт писал в файлы мимо работающей
 * админки, та его запись не видела (плашка «правки не на сайте» не
 * уходила), а два писателя в одной базе — ровно то, что утром
 * 22.10.2026 её повредило.
 *
 * Теперь отметку ставит админка своей связью с базой — при первом
 * открытии любой страницы панели после успешной публикации. Помечаются
 * только правки до момента снимка базы: сделанные во время сборки на
 * сайт не попали.
 */
export async function settlePublish(): Promise<void> {
  const state = publishState()
  if (state.kind !== 'done' || !state.ok) return
  if (existsSync(MARKED) || !existsSync(STARTED)) return

  const startedAt = readFileSync(STARTED, 'utf8').trim()
  await markPublished(await getDb(), startedAt)
  writeFileSync(MARKED, new Date().toISOString(), 'utf8')
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
export async function startPublish(): Promise<{ started: boolean; reason?: string }> {
  if (runningPid() !== null) return { started: false, reason: 'Публикация уже идёт' }

  mkdirSync(DIR, { recursive: true })
  const startedAt = new Date().toISOString()
  const dumped = await dumpDatabase()
  writeFileSync(STARTED, startedAt, 'utf8')
  rmSync(MARKED, { force: true })
  const out = openSync(LOG, 'w')

  const child = spawn('npm', ['run', 'publish'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: {
      ...process.env,
      ...(dumped ? { PGLITE_SNAPSHOT_TGZ: SNAPSHOT } : {}),
      // Отметку «опубликовано» ставит сама админка (settlePublish), а не
      // скрипт: он открыл бы её базу второй копией PGlite.
      PUBLISH_MARK_IN_ADMIN: '1',
    },
    shell: true,
  })

  if (child.pid === undefined) return { started: false, reason: 'Не удалось запустить процесс' }

  writeFileSync(LOCK, String(child.pid), 'utf8')
  child.unref()
  return { started: true }
}
