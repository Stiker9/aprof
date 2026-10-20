'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/admin/nav'

/**
 * Ссылка в боковом меню с подсветкой текущего раздела.
 *
 * Клиентская, потому что «где я сейчас» знает только браузер:
 * `usePathname` в серверном компоненте недоступен. Весь остальной
 * макет при этом остаётся серверным — в браузер уезжает одна эта
 * ссылка.
 *
 * Для вложенных адресов проверяется начало с косой: так /admin/tovary
 * подсветится на /admin/tovary/что-то, но не на /admin/tovary-chego-to.
 *
 * Сводка — исключение, и только точное совпадение. Её адрес /admin
 * является началом адреса любого раздела админки, и по общему правилу
 * она горела бы подсвеченной везде. Так и было: на странице заявок
 * красными стояли сразу два пункта, и подсветка переставала отвечать
 * на вопрос «где я».
 */
const ROOT = '/admin'

export function NavLink({ item, badge }: { item: NavItem; badge?: number }) {
  const pathname = usePathname()
  const active =
    item.href === ROOT
      ? pathname === ROOT
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  if (item.soon) {
    return (
      <span
        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-ink-dim"
        title="Раздел ещё не сделан"
      >
        <span>{item.label}</span>
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] tracking-wide uppercase">
          скоро
        </span>
      </span>
    )
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors ${
        active ? 'bg-accent text-white' : 'text-ink-muted hover:bg-nav-hover hover:text-ink'
      }`}
    >
      <span className="flex flex-col">
        <span className={active ? 'font-semibold' : ''}>{item.label}</span>
        {item.hint && (
          <span className={`text-[11px] ${active ? 'text-white/70' : 'text-ink-dim'}`}>
            {item.hint}
          </span>
        )}
      </span>

      {badge !== undefined && badge > 0 && (
        <span
          className={`num min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold ${
            active ? 'bg-white/20 text-white' : 'bg-accent text-white'
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
