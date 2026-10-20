import { count } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { currentAdmin } from '@/admin/auth'
import { LoginForm } from '@/components/admin/login-form'
import { getDb } from '@/db/client'
import { adminUsers } from '@/db/schema'

/**
 * Страница входа.
 *
 * Лежит вне группы `(panel)`, поэтому без бокового меню — показывать
 * разделы тому, кто ещё не вошёл, незачем.
 *
 * Вошедшего отправляем внутрь. Иначе по закладке на /admin/vhod он
 * каждый раз видел бы форму и вводил пароль заново, хотя печенька
 * действует неделю.
 *
 * Отдельно проверяется, создан ли вообще пользователь: на свежей базе
 * форма приняла бы пароль и ответила «неверный логин», не объяснив,
 * что входить пока некем.
 */
export default async function LoginPage() {
  if (await currentAdmin()) redirect('/admin')

  const db = await getDb()
  const [row] = await db.select({ n: count() }).from(adminUsers)

  return <LoginForm hasUser={Number(row?.n ?? 0) > 0} />
}
