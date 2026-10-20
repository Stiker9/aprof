import Link from 'next/link'
import type { ReactNode } from 'react'
import { NAV } from '@/admin/nav'
import { logout } from '@/admin/actions'
import { plural } from '@/catalog/format'
import { MobileNav } from './mobile-nav'
import { NavLink } from './nav-link'

/**
 * Оболочка админки: тёмная боковая колонка и светлое поле работы.
 *
 * ── Почему тёмное меню на светлом поле ──
 *
 * Тот же контраст держит сайт — тёмные секции и светлые. Но причина
 * здесь не в единстве стиля: меню и содержимое должны быть сразу
 * различимы, потому что в админке глаз возвращается к одному и тому же
 * месту сотни раз за день. Светлое меню на светлом поле заставляет
 * каждый раз искать границу.
 *
 * Поле работы светлое, а не тёмное, по той же причине: в нём таблицы и
 * поля ввода, а их читают долго. Тёмный фон под мелким текстом
 * утомляет быстрее.
 *
 * ── Почему колонка фиксирована, а прокручивается только содержимое ──
 *
 * В таблице товаров пять тысяч строк. Если бы прокручивалась страница
 * целиком, меню уезжало бы наверх, и переход в другой раздел требовал
 * сначала прокрутить обратно.
 *
 * ── На телефоне колонка уезжает за край ──
 *
 * 240 пикселей от экрана шириной 390 — это больше половины. Поэтому
 * на узком экране меню прячется и выдвигается по нажатию, а сверху
 * остаётся полоса с открывашкой. Разметка при этом одна и та же:
 * MobileNav оборачивает ту же колонку, что видна на широком экране, и
 * двух разных меню, которые надо помнить править оба, не возникает.
 */
export function AdminShell({
  login,
  newRequests,
  pending,
  children,
}: {
  login: string
  newRequests: number
  pending: number
  children: ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <MobileNav>
        <div className="px-4 pt-5 pb-4">
          <Link href="/admin" className="block">
            <span className="block font-[family-name:var(--font-display)] text-[15px] font-bold tracking-tight">
              VASHFARKOP
            </span>
            <span className="block text-[11px] tracking-[0.18em] text-ink-dim uppercase">
              панель управления
            </span>
          </Link>
        </div>

        <nav className="nav-scroll flex-1 overflow-y-auto px-2 pb-2">
          {NAV.map((group) => (
            <div key={group.title} className="mb-4">
              <h2 className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-ink-dim uppercase">
                {group.title}
              </h2>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    badge={item.badge === 'requests' ? newRequests : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <PublishBar pending={pending} />

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3 text-[12px]">
          <span className="truncate text-ink-muted" title={login}>
            {login}
          </span>
          <form action={logout}>
            <button type="submit" className="text-ink-dim transition-colors hover:text-accent">
              Выйти
            </button>
          </form>
        </div>
      </MobileNav>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

/**
 * Полоса «правки ждут публикации».
 *
 * Стоит в меню, а не на странице, намеренно: это состояние всей
 * админки, а не одного экрана. Владелец должен видеть его из любого
 * раздела, иначе двадцать правленых цен так и останутся лежать в базе,
 * а он будет уверен, что они на сайте.
 */
function PublishBar({ pending }: { pending: number }) {
  if (pending === 0) {
    return (
      <div className="border-t border-line px-4 py-3 text-[12px] text-ink-dim">
        Всё опубликовано
      </div>
    )
  }

  return (
    <Link
      href="/admin/publikacii"
      className="block border-t border-line bg-accent/10 px-4 py-3 transition-colors hover:bg-accent/20"
    >
      <span className="num block text-[13px] font-semibold text-accent-bright">
        {pending} {plural(pending, 'правка', 'правки', 'правок')} не на сайте
      </span>
      <span className="block text-[11px] text-ink-muted">Нажмите, чтобы опубликовать</span>
    </Link>
  )
}
