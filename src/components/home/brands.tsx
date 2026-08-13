import Link from 'next/link'
import { formatCount } from '@/catalog/format'
import type { BrandRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

/**
 * Каталог по маркам на главной.
 *
 * Не только витрина: это главный узел перелинковки. Отсюда вес главной
 * растекается на 106 страниц марок, а с них вглубь на модели и кузова.
 * Без этой секции каталог получал бы вес только через подвал.
 *
 * Логотипов пока нет — они появятся вместе с обработкой изображений.
 */
export function Brands({
  brands,
  totalBrands,
}: {
  brands: BrandRow[]
  totalBrands: number
}) {
  const rest = totalBrands - brands.length

  return (
    <Section tone="light">
      <Eyebrow>Каталог</Eyebrow>
      <SectionTitle>{formatCount(totalBrands, 'марка', 'марки', 'марок')}</SectionTitle>
      <SectionLead>Найдём под любую</SectionLead>

      <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line-light bg-line-light sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={urls.brand(brand.slug)}
            className="group bg-paper-3 px-4 py-6 text-center transition-colors hover:bg-paper-2"
          >
            <span className="block text-[15px] text-ink-dark transition-colors group-hover:text-accent">
              {brand.name}
            </span>
            <span className="mt-1 block text-xs opacity-55">
              {formatCount(brand.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
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
