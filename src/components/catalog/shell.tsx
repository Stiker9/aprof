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
 * Блок собран из трёх частей, как в исходнике макета:
 *
 * 1. Полоса в 60 пикселей сверху — подложка под плавающую шапку. Шапка
 *    вынута из потока и лежит поверх; без подложки она висела бы прямо
 *    на белом содержимом.
 * 2. Строка подбора. Липкая: при прокрутке длинного списка марок она
 *    остаётся под рукой, а это главный вход в подбор.
 * 3. Белое содержимое со скруглением снизу.
 */
export function CatalogShell({
  crumbs,
  title,
  summary,
  picker,
  titleFont = 'display',
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
  /**
   * Каким шрифтом набрать заголовок.
   *
   * `display` — название раздела: «Фаркопы по маркам автомобилей».
   * Это вывеска, и Unbounded ей к лицу.
   *
   * `body` — имя самого товара: «Фаркоп GALIA T030A на Toyota RAV4
   * XA10 1995–2000». Это длинная строка с артикулом и годами, и в
   * заголовочном шрифте она читается тяжело — цифры и латиница в
   * Unbounded широкие. Поэтому текстовым, но плотнее и жирнее.
   */
  titleFont?: 'display' | 'body'
  children: ReactNode
}) {
  return (
    <main className="flex-1 text-ink-dark">
      <div className="-mb-1.5 h-[60px] rounded-t-[var(--radius-block)] bg-[linear-gradient(180deg,#1A1A20_0%,#141418_100%)]" />

      {picker === false ? null : (
        <div className="z-20 border-b lg:sticky lg:top-[62px] border-white/10 bg-[linear-gradient(180deg,#141418_0%,#191920_55%,#101014_100%)] backdrop-blur-[22px] backdrop-saturate-[1.3]">
          <PickerBar {...picker} bare />
        </div>
      )}

      <div className="flex flex-col gap-7 rounded-b-[var(--radius-block)] bg-white px-5 pb-10 pt-6 sm:px-8 lg:px-14 lg:pb-16 lg:pt-7">
        <Breadcrumbs items={crumbs} />

        <div className="flex flex-col gap-2.5">
          {/*
            Трекинг у названия раздела нулевой, в отличие от заголовков
            главной: оно длинное и читается как вывеска, а не как
            высказывание. Сжимать его по буквам незачем.
          */}
          <h1
            className={
              titleFont === 'display'
                ? 'font-[family-name:var(--font-display)] text-[32px] leading-[1.15]'
                : 'max-w-[760px] text-[32px] font-medium leading-[1.2] tracking-[-0.02em]'
            }
          >
            {title}
          </h1>
          {summary ? <p className="text-sm text-[#6E6E6C]">{summary}</p> : null}
        </div>

        {children}
      </div>
    </main>
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
      className="group flex flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-ink-dark/8 bg-white px-5 py-4 transition-colors hover:border-accent"
    >
      <span>
        <span className="block text-[15px] transition-colors group-hover:text-accent">{title}</span>
        {note ? <span className="mt-1 block text-[13px] opacity-55">{note}</span> : null}
      </span>
      <span className="text-[11px] opacity-50">{count}</span>
    </Link>
  )
}
