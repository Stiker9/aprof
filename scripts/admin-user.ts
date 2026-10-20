import { randomInt } from 'node:crypto'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { hashPassword } from '../src/admin/password'
import { applyMigrations } from '../src/db/migrate'
import * as schema from '../src/db/schema'

/**
 * Заводит владельца сайта или меняет ему пароль.
 *
 *   npx tsx scripts/admin-user.ts vladelec
 *
 * ── Почему пароль генерируется, а не спрашивается ──
 *
 * Пароль в аргументе команды попадает в историю оболочки и в список
 * процессов — то есть становится виден любому, кто сядет за эту машину
 * или заглянет в `ps`. Спрашивать его из терминала скрытым вводом можно,
 * но тогда владелец придумает «farkop2024», и дальше беспокоиться о
 * стойкости хеша будет не о чем.
 *
 * Поэтому пароль выдаёт скрипт, печатает один раз и больше нигде не
 * хранит — в базу уходит только хеш. Сменить его владелец сможет в
 * самой админке.
 *
 * ── Почему без цифр 0/1 и букв l/O ──
 *
 * Пароль передают голосом или перепечатывают с листа. Ноль и «О»,
 * единица и «l» в этом месте стоят лишнего звонка.
 */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const LENGTH = 16

const DB_PATH = process.env.PGLITE_PATH || path.resolve(__dirname, '..', '.pgdata')

function generatePassword(): string {
  // randomInt, а не Math.random: второй предсказуем по нескольким
  // значениям, и пароль из него перебирается не за 56^16, а мгновенно.
  let out = ''
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}

async function main() {
  const login = process.argv[2]?.trim()
  if (!login) {
    console.error('Укажите логин: npx tsx scripts/admin-user.ts <логин>')
    process.exit(1)
  }

  const client = new PGlite(DB_PATH)
  await applyMigrations(client)
  const db = drizzle(client, { schema })

  const password = generatePassword()
  const passwordHash = await hashPassword(password)

  const [existing] = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.login, login))
    .limit(1)

  if (existing) {
    await db
      .update(schema.adminUsers)
      .set({ passwordHash })
      .where(eq(schema.adminUsers.id, existing.id))
  } else {
    await db.insert(schema.adminUsers).values({
      login,
      passwordHash,
      createdAt: new Date().toISOString(),
    })
  }

  console.log('')
  console.log(existing ? 'Пароль изменён.' : 'Пользователь создан.')
  console.log('')
  console.log(`  логин:  ${login}`)
  console.log(`  пароль: ${password}`)
  console.log('')
  console.log('Пароль показан один раз — в базе лежит только его хеш.')
  console.log('Вход: /admin/vhod')

  await client.close()
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
