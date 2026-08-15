import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Призыв к действию текстовой ссылкой со стрелкой.
 *
 * Основной приём макета: на главной кнопки-заливки оставлены только
 * для главного действия, всё остальное — ссылки. Кнопка в каждой секции
 * превращает страницу в набор форм, а не в рассказ.
 */
export function ArrowLink({
  href,
  children,
  muted,
}: {
  href: string
  children: ReactNode
  muted?: ReactNode
}) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-3">
      <Link href={href} className="text-accent transition-colors hover:text-accent-hover">
        {children} <span aria-hidden>→</span>
      </Link>
      {muted ? <span className="text-sm opacity-50">{muted}</span> : null}
    </span>
  )
}
