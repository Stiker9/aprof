// Пакета server-only в проекте нет; защиту от утечки в браузер даёт
// 'use server' в действиях и node:crypto, который сборщик в клиентский
// бандл не пустит и падает ошибкой сборки, а не тихо.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * Вход в админку: подписанная печенька вместо таблицы сессий.
 *
 * ── Почему подпись, а не записи в базе ──
 *
 * Пользователь один — владелец сайта. Таблица сессий для одного
 * человека это лишняя сущность, которую придётся чистить от просроченных
 * записей. Подписанная строка не требует ни того, ни другого: сервер
 * проверяет её ключом и сразу знает, своя ли она.
 *
 * ── Почему не jose/JWT ──
 *
 * JWT нужен, когда токен читает кто-то ещё: другой сервис, мобильное
 * приложение, чужой бэкенд. Здесь строку выдаёт и проверяет один и тот
 * же процесс, и весь стандарт сводится к HMAC — он есть в Node.
 *
 * Заодно мимо проходят собственные грабли JWT: заголовок `alg` внутри
 * самого токена. Библиотеки, которые ему доверяют, принимают `alg:
 * none`. Здесь алгоритм задан в коде и из строки не читается.
 *
 * ── Что внутри ──
 *
 * `base64url(полезное).base64url(подпись)`. В полезном — логин и срок.
 * Подпись покрывает его целиком, поэтому подменить срок не выйдет.
 *
 * Пароля и персональных данных внутри нет: печенька уходит в браузер, и
 * всё, что в ней лежит, читается без ключа. Ключ защищает её от
 * подделки, но не от чтения.
 */

const COOKIE = 'vf_admin'

/** Неделя. Владелец заходит раз в несколько дней — чаще просить пароль незачем. */
const LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

export interface AdminSession {
  login: string
  /** Когда печенька перестаёт действовать, в миллисекундах эпохи. */
  exp: number
}

/**
 * Ключ подписи.
 *
 * Значения по умолчанию здесь нет намеренно. Запасной ключ в коде — это
 * ключ, известный всем, у кого есть репозиторий: подделать печеньку
 * владельца становится упражнением на пять строк. Лучше внятная ошибка
 * при запуске, чем админка, которая работает и при этом открыта.
 */
function secret(): Buffer {
  const value = process.env.ADMIN_SECRET
  if (!value || value.length < 32) {
    throw new Error(
      'Не задан ADMIN_SECRET (нужна строка от 32 символов). Положите его в .env.local — ' +
        'сгенерировать: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    )
  }
  return Buffer.from(value, 'utf8')
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function encode(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  return `${payload}.${sign(payload)}`
}

/**
 * Разбирает печеньку. Любая неудача — `null`, без исключений: сюда
 * приходит строка из браузера, то есть произвольные байты.
 */
function decode(token: string | undefined): AdminSession | null {
  if (!token) return null

  const dot = token.indexOf('.')
  if (dot < 1) return null

  const payload = token.slice(0, dot)
  const given = Buffer.from(token.slice(dot + 1), 'base64url')
  const want = Buffer.from(sign(payload), 'base64url')

  // Длину сверяем до timingSafeEqual: при разной он бросает, а не врёт.
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown
    if (typeof parsed !== 'object' || parsed === null) return null

    const { login, exp } = parsed as Partial<AdminSession>
    if (typeof login !== 'string' || typeof exp !== 'number') return null
    if (exp < Date.now()) return null

    return { login, exp }
  } catch {
    return null
  }
}

export async function createSession(login: string): Promise<void> {
  const exp = Date.now() + LIFETIME_MS
  const store = await cookies()

  store.set(COOKIE, encode({ login, exp }), {
    httpOnly: true,
    // Локально админка открывается по http, и `secure: true` там просто
    // не даёт войти: браузер печеньку не сохраняет и молчит об этом.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(exp),
  })
}

export async function readSession(): Promise<AdminSession | null> {
  const store = await cookies()
  return decode(store.get(COOKIE)?.value)
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/** Только для тестов: кодирование и разбор без обращения к печенькам. */
export const __test = { encode, decode }
