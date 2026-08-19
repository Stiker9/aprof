import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { formatCount, formatPrice } from '@/catalog/format'
import { logoFor } from '@/catalog/logos'
import type { BrandRow } from '@/catalog/queries'
import { countProducts, listBrands, minProductPrice } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { CONTACTS } from '@/content/contacts'
import { CATALOG_FAQ } from '@/content/faq'
import { getDb } from '@/db/client'

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
 * и латиница, и кириллица, и половина букв алфавита пустует.
 */
function AlphabetIndex({ brands }: { brands: BrandRow[] }) {
  const letters = [...new Set(brands.map((brand) => brand.name[0].toUpperCase()))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  )

  return (
    <nav
      aria-label="Марки по алфавиту"
      className="flex flex-wrap items-center gap-1 border-y border-ink-dark/10 py-3.5"
    >
      {letters.map((letter) => (
        <a
          key={letter}
          href={`#letter-${letter}`}
          className="flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors hover:bg-[#F2F1EF]"
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
    <CatalogShell
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Фаркопы' }]}
      title="Фаркопы по маркам автомобилей"
      summary={`${formatCount(totalProducts, 'фаркоп', 'фаркопа', 'фаркопов')} · ${formatCount(totalModels, 'модель', 'модели', 'моделей')} · ${formatCount(brands.length, 'марка', 'марки', 'марок')} · цены от ${formatPrice(minPrice)}`}
    >
      <AlphabetIndex brands={brands} />

      {/*
        Ячейки склеены в таблицу: зазор в один пиксель на общем фоне даёт
        сетку разделителей. Отдельными плитками с просветом, как на
        главной, здесь нельзя — там их две дюжины, а тут 106, и просветы
        рассыпают список на отдельные карточки вместо единого указателя.
      */}
      <div className="grid grid-cols-2 gap-px border border-ink-dark/8 bg-ink-dark/8 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => {
          const logo = logoFor(brand.slug)
          return (
            <Link
              key={brand.slug}
              id={anchorOf(brand)}
              href={urls.brand(brand.slug)}
              className="flex scroll-mt-32 flex-col items-center justify-center gap-[7px] bg-white px-2.5 py-5 transition-colors hover:bg-[#F2F1EF]"
            >
              {logo ? (
                /*
                  Логотипы обесцвечены и притушены. В цвете сетка из ста с
                  лишним марок превращается в рябь: каждый бренд тянет
                  внимание своим красным или синим, и найти нужную марку
                  становится труднее, а не легче.
                */
                <span className="relative block h-8 w-[52px] brightness-[.55] grayscale">
                  <Image src={logo} alt="" fill sizes="52px" className="object-contain" />
                </span>
              ) : null}

              <span className="text-center text-sm text-[#2E2E30]">{brand.name}</span>
              <span className="text-[11px] text-[#8A8A88]">
                {formatCount(brand.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
              </span>
            </Link>
          )
        })}
      </div>

      <section className="flex flex-wrap items-center justify-between gap-8 rounded-[var(--radius-card)] bg-[#F2F1EF] px-7 py-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[19px] font-medium">Не нашли свою марку?</h2>
          <p className="text-sm text-[#6E6E6C]">
            Подберём под редкие и старые модели — позвоните или оставьте номер.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <a href={CONTACTS.phoneHref} className="whitespace-nowrap text-[22px] font-medium">
            {CONTACTS.phone}
          </a>
          <Link
            href="/zapis"
            className="whitespace-nowrap rounded-lg bg-accent px-[26px] py-3.5 text-sm font-semibold text-[#FFF6F4] transition-[filter] hover:brightness-110"
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
      <section className="flex max-w-[800px] flex-col gap-3.5">
        <h2 className="text-[19px] font-medium">Как подбирается фаркоп</h2>

        <p className="text-[15px] leading-[1.7] text-[#4A4A4C]">
          Фаркоп подбирается не по марке и модели, а по кузову и годам выпуска. Один и тот же RAV4
          за тридцать лет сменил шесть поколений, и крепёжные точки в лонжеронах у них разные —
          деталь от XA40 физически не встанет на XA10. Поэтому в каталоге третий шаг обязательный:
          без кузова подбор даёт ложное совпадение.
        </p>

        <p className="text-[15px] leading-[1.7] text-[#4A4A4C]">
          Тип шара определяет, как фаркоп живёт между поездками. Шар A — цельносварной, самый
          простой и дешёвый, торчит всегда. Шар C снимается за пару секунд и убирается в багажник,
          поэтому его берут те, кому важен вид машины и парковочные датчики. Шар F — фланцевый, под
          него ставят переходники для велокреплений и грузовых платформ.
        </p>

        <p className="text-[15px] leading-[1.7] text-[#4A4A4C]">
          В установку входит монтаж по штатным точкам, антикоррозийная обработка креплений, вывод
          электрики через блок согласования и документы для техосмотра. Работа занимает около трёх
          часов, машина остаётся на ходу.
        </p>
      </section>

      <section className="flex flex-col">
        {CATALOG_FAQ.map((item, index) => (
          <details
            key={item.question}
            open={index === 0}
            className="group border-t border-ink-dark/10 py-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[17px] marker:hidden [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden
                className="text-base text-[#8A8A88] transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2.5 max-w-[720px] text-sm leading-[1.6] text-[#6E6E6C]">
              {item.answer}
            </p>
          </details>
        ))}
      </section>
    </CatalogShell>
  )
}
