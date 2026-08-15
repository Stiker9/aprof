import Image from 'next/image'
import Link from 'next/link'
import { formatCount } from '@/catalog/format'
import { logoFor } from '@/catalog/logos'
import type { BrandRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'

/**
 * Каталог по маркам на главной.
 *
 * Не только витрина: это главный узел перелинковки. Отсюда вес главной
 * растекается на 106 страниц марок, а с них вглубь на модели и кузова.
 *
 * Поиск и фильтры пока не работают — им нужно состояние на клиенте, и
 * они идут одной задачей с живым подбором. Разметка стоит, потому что
 * без неё секция читается иначе: шесть рядов плиток без единого способа
 * сузить выбор выглядят тупиком.
 *
 * Логотип есть не у каждой марки: в макете их 25 на 106. Плитка без
 * логотипа — обычное состояние, а не поломка.
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
    /*
      Размеры внутри заданы обычной шкалой, а не долями высоты окна, как
      в исходнике макета. Там они схлопывались к нижней границе на любом
      невысоком экране: на ноутбуке 1920×980 название марки выходило
      14,7 пикселя вместо 16, и сетка читалась мелкой. Секция всё так же
      занимает экран, но текст от его высоты больше не зависит.
    */
    <section className="flex min-h-[calc(100vh-16px)] flex-col gap-10 overflow-hidden rounded-[var(--radius-block)] bg-paper-3 px-14 pb-16 pt-20 text-ink-dark">
      <div className="flex items-start justify-between gap-12">
        <div className="flex max-w-[560px] flex-col gap-3.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A8A88]">
            Каталог
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(30px,3.2vw,46px)] leading-[1.04] tracking-[-0.03em]">
            {formatCount(totalBrands, 'марка', 'марки', 'марок')},
            <br />
            {formatCount(totalModels, 'модель', 'модели', 'моделей')}
          </h2>
        </div>

        <div className="flex flex-[0_0_320px] items-center gap-3 rounded-xl border border-ink-dark/10 bg-white px-[18px] py-[15px]">
          <span aria-hidden className="text-[15px] text-[#8A8A88]">
            ⌕
          </span>
          <span className="text-[15px] text-[#8A8A88]">Марка или модель</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {FILTERS.map((label, index) => (
          <span
            key={label}
            className={`rounded-full px-4 py-2.5 text-sm ${
              index === 0
                ? 'bg-ink-dark text-paper'
                : 'border border-ink-dark/10 bg-white text-ink-dark/70'
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => {
          const logo = logoFor(brand.slug)
          return (
            <Link
              key={brand.slug}
              href={urls.brand(brand.slug)}
              className="flex flex-col items-center justify-center gap-2.5 rounded-[var(--radius-card)] border border-ink-dark/8 bg-white/72 px-3 py-7 backdrop-blur-[14px] backdrop-saturate-[1.2] transition-colors hover:border-accent hover:bg-white"
            >
              {logo ? (
                <span className="relative block h-9 w-14">
                  <Image src={logo} alt="" fill sizes="56px" className="object-contain" />
                </span>
              ) : null}

              <span className="text-center font-[family-name:var(--font-display)] text-[18px] leading-[1.1] text-[#2E2E30]">
                {brand.name}
              </span>

              <span className="text-[11px] uppercase tracking-[0.08em] text-[#8A8A88]">
                {formatCount(brand.modelCount, 'модель', 'модели', 'моделей')}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto flex items-center gap-[18px] pt-3">
        <Link href={urls.catalog()} className="flex items-center gap-3 text-[16px]">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-dark/30 text-sm"
          >
            ↗
          </span>
          Весь каталог
        </Link>
        {rest > 0 ? (
          <span className="text-[13px] text-[#8A8A88]">
            ещё {formatCount(rest, 'марка', 'марки', 'марок')}
          </span>
        ) : null}
      </div>
    </section>
  )
}
