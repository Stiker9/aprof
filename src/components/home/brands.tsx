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
 * Без этой секции каталог получал бы вес только через подвал.
 *
 * В ячейке число моделей, а не фаркопов: человек ищет свою машину, а
 * не количество железа, и «92 модели» подсказывает, есть ли шанс найти
 * там свою. Число моделей складывается по маркам без обмана — модель
 * принадлежит ровно одной марке, в отличие от фаркопов, которые
 * подходят сразу к нескольким.
 *
 * Поиска и фильтров по регионам, которые есть в макете, здесь пока нет:
 * им нужно состояние на клиенте, и они идут одной задачей вместе с
 * живым подбором.
 *
 * Логотипы марок появятся в подпроекте изображений.
 */
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
      <Eyebrow>Каталог</Eyebrow>

      <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(26px,4vw,34px)] leading-tight tracking-[-0.03em]">
        {formatCount(totalBrands, 'марка', 'марки', 'марок')},
        <span className="block opacity-45">
          {formatCount(totalModels, 'модель', 'модели', 'моделей')}
        </span>
      </h2>

      {/*
        На узком экране сетка в две колонки, а не в одну: 24 марки
        столбиком растягивают секцию на два с половиной экрана, и до
        акций уже никто не долистывает.
      */}
      <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line-light bg-line-light sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={urls.brand(brand.slug)}
            className="group flex flex-col justify-between gap-6 bg-paper-3 px-4 py-5 transition-colors hover:bg-paper-2"
          >
            <span className="text-[15px] text-ink-dark transition-colors group-hover:text-accent">
              {brand.name}
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] opacity-50">
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
