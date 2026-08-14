import Link from 'next/link'
import { formatCount } from '@/catalog/format'
import type { BrandRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section } from '@/components/ui/section'

/**
 * Каталог по маркам на главной.
 *
 * Не только витрина: это главный узел перелинковки. Отсюда вес главной
 * растекается на 106 страниц марок, а с них вглубь на модели и кузова.
 *
 * Поиск и фильтры пока не работают — им нужно состояние на клиенте, и
 * они идут одной задачей с живым подбором. Разметка стоит, потому что
 * без неё секция читается иначе: шесть рядов карточек без единого
 * способа сузить выбор выглядят тупиком.
 */
const FILTERS = ['Все марки', 'Китайские', 'Европейские', 'Японские и корейские', 'Российские']

export function Brands({
  brands,
  totalBrands,
  totalModels,
}: {
  /** Марки, показанные в сетке, — не все, а первые по числу товаров. */
  brands: BrandRow[]
  totalBrands: number
  totalModels: number
}) {
  const rest = totalBrands - brands.length

  return (
    <Section tone="light">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Каталог</Eyebrow>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(26px,4vw,34px)] leading-tight tracking-[-0.03em]">
            {formatCount(totalBrands, 'марка', 'марки', 'марок')},
            <span className="block opacity-45">
              {formatCount(totalModels, 'модель', 'модели', 'моделей')}
            </span>
          </h2>
        </div>

        <div className="flex h-[51px] w-full max-w-[357px] items-center gap-3 rounded-[10px] border border-ink-dark/10 bg-white px-4">
          <span aria-hidden className="opacity-35">
            ⌕
          </span>
          <span className="text-sm opacity-45">Марка или модель</span>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {FILTERS.map((label, index) => (
          <span
            key={label}
            className={`rounded-full border px-4 py-2.5 text-sm ${
              index === 0
                ? 'border-transparent bg-ink-dark text-paper'
                : 'border-ink-dark/10 bg-white opacity-70'
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/*
        Карточки стоят отдельными плитками с зазором, а не склеены в
        таблицу через общий фон: в макете каждая со своим скруглением
        и полупрозрачной подложкой.
      */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={urls.brand(brand.slug)}
            className="group flex h-[91px] flex-col justify-between rounded-[var(--radius-card)] border border-ink-dark/8 bg-white/72 px-4 py-4 transition-colors hover:border-accent hover:bg-white"
          >
            <span className="text-[15px] transition-colors group-hover:text-accent">
              {brand.name}
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] opacity-45">
              {formatCount(brand.modelCount, 'модель', 'модели', 'моделей')}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <ArrowLink
          href={urls.catalog()}
          muted={rest > 0 ? `ещё ${formatCount(rest, 'марка', 'марки', 'марок')}` : undefined}
        >
          Весь каталог
        </ArrowLink>
      </div>
    </Section>
  )
}
