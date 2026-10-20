import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

/**
 * Хеширование пароля владельца.
 *
 * ── Почему scrypt, а не bcrypt ──
 *
 * bcrypt — это внешний пакет с нативной сборкой: на Windows он тянет
 * компилятор, и установка проекта перестаёт быть `npm i`. scrypt входит
 * в Node, рекомендован к подбору пароля (RFC 7914) и по стойкости
 * bcrypt не уступает — он к тому же требователен к памяти, а значит
 * плохо ускоряется на видеокартах.
 *
 * ── Почему не SHA-256 с солью ──
 *
 * Быстрый хеш для пароля не годится: на одной видеокарте перебираются
 * миллиарды в секунду, и восьмизначный пароль падает за минуты. Здесь
 * один подбор стоит ~16 МБ памяти и десятки миллисекунд.
 *
 * ── Что лежит в базе ──
 *
 * Строка `scrypt$N$r$p$соль$хеш`. Параметры пишутся рядом с хешем, а не
 * берутся из кода: когда через два года их поднимут, старые пароли
 * обязаны продолжать проверяться — иначе владелец не войдёт, и
 * восстановить будет нечего.
 */
/**
 * Обёртка написана руками, а не через `promisify`.
 *
 * У `scrypt` две перегрузки — с параметрами и без, — и promisify
 * выбирает первую: вариант с options для TypeScript перестаёт
 * существовать, и вызов с четырьмя аргументами не компилируется.
 */
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

/** Стоимость подбора. 128 · N · r = 16 МБ памяти на одну проверку. */
const N = 16384
const R = 8
const P = 1
const KEY_LENGTH = 32

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
  })

  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$')
}

/**
 * Проверяет пароль против строки из базы.
 *
 * Сравнение — timingSafeEqual, а не `===`. Обычное сравнение строк
 * выходит на первом несовпавшем байте, и по времени ответа можно
 * подбирать хеш побайтно. Разница в микросекундах, но она измерима.
 *
 * Любая кривая строка из базы — это `false`, а не исключение: иначе
 * испорченная запись валит страницу входа, и починить её станет
 * некому.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const n = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  const salt = Buffer.from(parts[4], 'base64')
  const expected = Buffer.from(parts[5], 'base64')
  if (salt.length === 0 || expected.length === 0) return false

  try {
    const key = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
      N: n,
      r,
      p,
      // Память считается по параметрам из базы, а не по нынешним: при
      // их повышении старые записи иначе упёрлись бы в потолок Node.
      maxmem: 256 * n * r,
    })
    return timingSafeEqual(key, expected)
  } catch {
    return false
  }
}
