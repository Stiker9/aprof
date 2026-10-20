import type { ReactNode } from 'react'
import { requireAdmin } from '@/admin/auth'
import { countNewRequests, pendingCount } from '@/admin/store'
import { AdminShell } from '@/components/admin/shell'
import { getDb } from '@/db/client'

/**
 * Оболочка разделов админки.
 *
 * Группа `(panel)` нужна, чтобы страница входа осталась без этой
 * оболочки: она лежит рядом, в /admin/vhod, и показывать на ней
 * боковое меню с разделами было бы странно — человек ещё не вошёл.
 * Группа в адрес не попадает, поэтому разделы остаются на /admin/…
 *
 * Проверка входа стоит и здесь, и в каждом действии. Здесь — чтобы не
 * отдать разметку чужому; в действиях — потому что их вызывают мимо
 * страниц (см. src/admin/auth.ts).
 *
 * Счётчики читаются в макете, а не на страницах: они видны из любого
 * раздела, и запрашивать их на каждой странице заново значит
 * продублировать два запроса десять раз.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin()
  const db = await getDb()

  const [newRequests, pending] = await Promise.all([countNewRequests(db), pendingCount(db)])

  return (
    <AdminShell login={session.login} newRequests={newRequests} pending={pending}>
      {children}
    </AdminShell>
  )
}
