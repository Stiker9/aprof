import Link from 'next/link'
import type { ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs'
import { PickerBar } from '@/components/picker-bar'

/**
 * Общая обёртка страниц каталога.
 *
 * Каталог светлый — в отличие от главной, где тёмные и светлые секции
 * чередуются. Это не прихоть оформления: на главной человек читает, а
 * в каталоге сравнивает таблицы, цены и характеристики, и тёмный фон
 * под плотными данными утомляет быстрее.
 *
 * Шапка, строка подбора, крошки, заголовок и строка-сводка одинаковы
 * на четырёх страницах — марка, модель, кузов, товар. Держатся здесь,
 * чтобы не разъезжались.
 */
export function CatalogShell({
  crumbs,
  title,
  summary,
  picker,
  children,
}: {
  crumbs: Crumb[]
  title: ReactNode
  /** Строка под заголовком: сколько всего, от какой цены. */
  summary?: ReactNode
  /**
   * Значения, уже выбранные в строке подбора, либо `false` — тогда
   * строки нет совсем. На странице услуги подбирать нечего, и пустые
   * списки там только сбивали бы с толку.
   */
  picker?: { brand?: string; model?: string; variant?: string } | false
  children: ReactNode
}) {
  return (
    <>
      {picker === false ? null : <PickerBar {...picker} />}

      <main className="flex-1 bg-paper-3 text-ink-dark">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
          <Breadcrumbs items={crumbs} />

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(24px,3.4vw,32px)] leading-[1.15] tracking-[-0.02em]">
            {title}
          </h1>

          {summary ? <p className="mt-4 text-sm opacity-55">{summary}</p> : null}

          {children}
        </div>
      </main>
    </>
  )
}

/**
 * Плитка со ссылкой вглубь каталога: модель, поколение, кузов.
 *
 * Число внизу, а не рядом с названием: у плиток разной высоты названия
 * тогда выстраиваются по одной линии сверху, а счётчики по одной снизу.
 */
export function CatalogTile({
  href,
  title,
  note,
  count,
}: {
  href: string
  title: string
  note?: string
  count: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-line-light bg-white px-5 py-4 transition-colors hover:border-accent"
    >
      <span>
        <span className="block text-[15px] transition-colors group-hover:text-accent">{title}</span>
        {note ? <span className="mt-1 block text-[13px] opacity-55">{note}</span> : null}
      </span>
      <span className="text-[11px] opacity-50">{count}</span>
    </Link>
  )
}
