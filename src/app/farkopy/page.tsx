import type { Metadata } from 'next'
import Link from 'next/link'
import { formatCount, formatPrice } from '@/catalog/format'
import { countProducts, listBrands, minProductPrice } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { PickerBar } from '@/components/picker-bar'
import { Accordion } from '@/components/ui/accordion'
import { CATALOG_FAQ } from '@/content/faq'
import { getDb } from '@/db/client'
import type { BrandRow } from '@/catalog/queries'

export const metadata: Metadata = {
  title: 'Каталог фаркопов по маркам автомобилей',
  description:
    'Фаркопы для 106 марок автомобилей. Подбор по марке, модели и году выпуска, установка и доставка по России.',
  alternates: { canonical: absolute(urls.catalog()) },
}

/**
 * Алфавитный указатель.
 *
 * Список из 106 марок глазами не просматривают — в него прыгают. Буквы
 * собираются из самих марок, а не задаются алфавитом: в каталоге есть
 * и латиница, и кириллица («Лада»), и половина букв алфавита пустует.
 */
function AlphabetIndex({ brands }: { brands: BrandRow[] }) {
  const letters = [...new Set(brands.map((brand) => brand.name[0].toUpperCase()))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  )

  return (
    <nav aria-label="Марки по алфавиту" className="mt-10 flex flex-wrap gap-1">
      {letters.map((letter) => (
        <a
          key={letter}
          href={`#letter-${letter}`}
          className="flex h-[30px] w-[30px] items-center justify-center rounded text-sm font-medium transition-colors hover:bg-line-light"
        >
          {letter}
        </a>
      ))}
    </nav>
  )
}

export default async function CatalogPage() {
  const db = await getDb()
  const [brands, totalProducts, minPrice] = await Promise.all([
    listBrands(db),
    countProducts(db),
    minProductPrice(db),
  ])
  const totalModels = brands.reduce((sum, brand) => sum + brand.modelCount, 0)

  // Первая марка на каждую букву получает якорь — к ней ведёт указатель.
  const seen = new Set<string>()
  const anchorOf = (brand: BrandRow) => {
    const letter = brand.name[0].toUpperCase()
    if (seen.has(letter)) return undefined
    seen.add(letter)
    return `letter-${letter}`
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden rounded-[var(--radius-block)] bg-paper-3 text-ink-dark">
      <PickerBar />

      <div>
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
          <Breadcrumbs items={[{ label: 'Главная', href: urls.home() }, { label: 'Фаркопы' }]} />

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(24px,3.4vw,32px)] leading-[1.15] tracking-[-0.02em]">
            Фаркопы по маркам автомобилей
          </h1>

          {/*
            Сводка одной строкой вместо четырёх плашек: это ориентир
            перед выбором, а не показатели, ради которых сюда пришли.
          */}
          <p className="mt-4 text-sm opacity-55">
            {formatCount(totalProducts, 'фаркоп', 'фаркопа', 'фаркопов')} ·{' '}
            {formatCount(totalModels, 'модель', 'модели', 'моделей')} ·{' '}
            {formatCount(brands.length, 'марка', 'марки', 'марок')} · цены от {formatPrice(minPrice)}
          </p>

          <AlphabetIndex brands={brands} />

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line-light bg-line-light sm:grid-cols-3 lg:grid-cols-6">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                id={anchorOf(brand)}
                href={urls.brand(brand.slug)}
                className="group flex scroll-mt-6 flex-col justify-between gap-6 bg-white px-4 py-5 transition-colors hover:bg-paper-2"
              >
                <span className="text-sm transition-colors group-hover:text-accent">
                  {brand.name}
                </span>
                {/*
                  Одно число, а не два: рядом стоящие «7 · 2 модели»
                  читаются как одна величина, и непонятно, что чему.
                */}
                <span className="text-[11px] opacity-50">
                  {formatCount(brand.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
                </span>
              </Link>
            ))}
          </div>

          <section className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
            <div>
              <h2 className="text-[19px] font-medium">Не нашли свою марку?</h2>
              <p className="mt-2 max-w-[52ch] text-sm opacity-60">
                Подберём под редкие и старые модели — позвоните или оставьте номер.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <a href="tel:+78121234567" className="text-[19px] font-semibold">
                +7 (812) 123-45-67
              </a>
              <Link
                href="/kontakty"
                className="rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Оставить номер
              </Link>
            </div>
          </section>

          {/*
            Несущий текст страницы, а не украшение: он отвечает на вопрос,
            с которым сюда приходят, и без него страница остаётся списком
            ссылок без единого слова по делу.
          */}
          <section className="mt-16 max-w-[80ch]">
            <h2 className="text-[19px] font-medium">Как подбирается фаркоп</h2>

            <p className="mt-5 leading-relaxed opacity-75">
              Фаркоп подбирается не по марке и модели, а по кузову и годам выпуска. Один и тот же
              RAV4 за тридцать лет сменил пять поколений, и крепёжные точки в лонжеронах у них
              разные — деталь от XA40 физически не встанет на XA10. Поэтому в каталоге третий шаг
              обязательный: без кузова подбор даёт ложное совпадение.
            </p>

            <p className="mt-5 leading-relaxed opacity-75">
              Тип шара определяет, как фаркоп живёт между поездками. Шар A — цельносварной, самый
              простой и дешёвый, торчит всегда. Шар C снимается за пару секунд и убирается в
              багажник, поэтому его берут те, кому важен вид машины и парковочные датчики. Шар F —
              фланцевый, под него ставят переходники для велокреплений и грузовых платформ.
            </p>

            <p className="mt-5 leading-relaxed opacity-75">
              В установку входит монтаж по штатным точкам, антикоррозийная обработка креплений,
              вывод электрики через блок согласования и документы для техосмотра. Работа занимает
              около трёх часов, машина остаётся на ходу.
            </p>
          </section>

          <section className="mt-16">
            <h2 className="text-[19px] font-medium">Частые вопросы</h2>
            <div className="mt-6">
              <Accordion items={CATALOG_FAQ} />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
