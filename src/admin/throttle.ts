/**
 * Защита входа от перебора.
 *
 * ── Зачем, если пароль из шестнадцати знаков ──
 *
 * Пароль владельца сильный, но меняет он его сам и когда-нибудь
 * поменяет на «Фаркоп2026». А админка будет открыта в интернет: адрес
 * /admin/vhod находят сканерами в первые сутки. Без ограничения
 * попыток слабый пароль живёт минуты.
 *
 * scrypt сам по себе уже тормозит перебор — одна проверка стоит 16 МБ
 * памяти и десятки миллисекунд, то есть десятки попыток в секунду, а не
 * миллионы. Но десятки в секунду это два миллиона за сутки, чего для
 * «Фаркоп2026» достаточно.
 *
 * ── Почему в памяти процесса, а не в базе ──
 *
 * Счётчик неудач — не данные, а состояние защиты. В базе он потребовал
 * бы таблицы, миграции и чистки, а при перезапуске процесса всё равно
 * терялся бы вместе с полезностью: перезапуск в десять раз реже, чем
 * окно блокировки.
 *
 * Обратная сторона честная: перезапуск сервера снимает блокировку.
 * Перебирающему это даёт лишних пять попыток раз в несколько недель.
 */

/** После скольких неудач подряд вход закрывается. */
const MAX_FAILURES = 5

/** На сколько. Пять минут достаточно, чтобы перебор стал бессмысленным. */
const LOCK_MS = 5 * 60 * 1000

interface Entry {
  failures: number
  /** До какого времени вход закрыт. 0 — открыт. */
  lockedUntil: number
}

/**
 * Состояние на globalThis, а не в переменной модуля: в режиме
 * разработки Next перезагружает модули на каждую правку, и обычная
 * переменная обнулялась бы вместе со счётчиком.
 */
const store = globalThis as typeof globalThis & {
  __vashfarkopLoginAttempts?: Map<string, Entry>
}

function attempts(): Map<string, Entry> {
  store.__vashfarkopLoginAttempts ??= new Map()
  return store.__vashfarkopLoginAttempts
}

/** Сколько секунд осталось до разблокировки. 0 — вход открыт. */
export function lockedFor(login: string): number {
  const entry = attempts().get(login)
  if (!entry) return 0

  const left = entry.lockedUntil - Date.now()
  if (left <= 0) {
    // Окно вышло — счётчик обнуляем, иначе шестая попытка за год
    // закрывала бы вход сразу.
    if (entry.lockedUntil !== 0) attempts().delete(login)
    return 0
  }
  return Math.ceil(left / 1000)
}

export function noteFailure(login: string): void {
  const entry = attempts().get(login) ?? { failures: 0, lockedUntil: 0 }
  entry.failures += 1
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = Date.now() + LOCK_MS
    entry.failures = 0
  }
  attempts().set(login, entry)
}

export function noteSuccess(login: string): void {
  attempts().delete(login)
}
