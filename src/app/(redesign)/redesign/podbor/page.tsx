import { SectionLinks } from '@/redesign/components/section-links'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatCount, formatPrice } from '@/catalog/format'
import { countProducts, listBrands, minProductPrice } from '@/catalog/queries'
import { absolute, urls } from '@/redesign/urls'
import { CatalogFilter } from '@/components/catalog/catalog-filter'
import { CatalogShell } from '@/components/catalog/shell'
import { CONTACTS } from '@/content/contacts'
import { getDb } from '@/db/client'

export const metadata: Metadata = {
  title: 'Подбор фаркопа по параметрам — тип шара, нагрузка, цена',
  description:
    'Подберите фаркоп по типу шара, тяговой нагрузке, цене и наличию. 5 808 позиций, установка в Петербурге и доставка по России.',
  alternates: { canonical: absolute('/podbor') },
}

/**
 * Подбор по параметрам.
 *
 * Отдельная страница от каталога, и разница между ними не в оформлении,
 * а в вопросе, на который каждая отвечает.
 *
 * Каталог: «что есть на мою машину» — марка, модель, поколение. Человек
 * знает автомобиль и идёт сверху вниз.
 *
 * Подбор: «что есть с такими свойствами» — съёмный шар, в наличии, без
 * выреза бампера, до пятнадцати тысяч. Марка тут не при чём.
 *
 * До этого оба пункта меню вели на одну страницу, и заказчик резонно
 * спрашивал, зачем их два. Теперь у каждого своя работа.
 *
 * Строка подбора по машине сверху остаётся: кто пришёл сюда со своей
 * маркой, тем не нужно возвращаться в каталог.
 */
export default async function PodborPage() {
  const db = await getDb()
  const [brands, totalProducts, minPrice] = await Promise.all([
    listBrands(db),
    countProducts(db),
    minProductPrice(db),
  ])

  /* Десять марок с наибольшим числом товаров — на них приходится больше
     половины каталога, и это самые вероятные входы отсюда в каталог. */
  const popular = [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 10)

  return (
    <CatalogShell
      /*
        Тёмной строки подбора сверху здесь нет: выбор машины переехал
        внутрь карточки фильтра первой строкой, как на референсе
        заказчика. Оставь её — те же три списка стояли бы на странице
        дважды.
      */
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Подбор' }]}
      title="Подбор фаркопа по параметрам"
      summary={`${formatCount(totalProducts, 'фаркоп', 'фаркопа', 'фаркопов')} · цены от ${formatPrice(minPrice)}`}
    >
      <SectionLinks kind="selection" />
      <CatalogFilter />

      {/*
        Ссылки на марки — не украшение: страница отдаётся без товаров в
        разметке (они приходят отдельным файлом), и без этого блока она
        была бы тупиком для обхода. Заодно это выход для тех, кто всё-таки
        знает свою машину.
      */}
      <section className="flex flex-col gap-4 border-t border-ink-dark/10 pt-8">
        <h2 className="text-[19px] font-medium">Фаркопы по маркам</h2>
        <div className="flex flex-wrap gap-2">
          {popular.map((brand) => (
            <Link
              key={brand.slug}
              href={urls.brand(brand.slug)}
              className="rounded-full border border-ink-dark/15 px-4 py-2 text-sm transition-colors hover:border-ink-dark"
            >
              {brand.name}{' '}
              <span className="text-ink-muted">{brand.productCount}</span>
            </Link>
          ))}
          <Link
            href={urls.catalog()}
            className="rounded-full border border-accent px-4 py-2 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-soft"
          >
            Все {brands.length} марок →
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-8 rounded-[var(--radius-card)] bg-[#F2F1EF] px-7 py-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[19px] font-medium">Не знаете, что выбрать?</h2>
          <p className="text-sm text-[#6E6E6C]">
            Назовите машину и что возите — подскажем, какой шар и какая нагрузка нужны.
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
    </CatalogShell>
  )
}

