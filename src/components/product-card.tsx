import Link from 'next/link'
import { formatNumber, formatPrice } from '@/catalog/format'
import { productDisplayImage } from '@/catalog/product-image'
import type { ProductRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'

const BUMPER_LABEL: Record<ProductRow['bumperCut'], string | null> = {
  not_required: 'без выреза бампера',
  required: 'нужен вырез бампера',
  unknown: null,
}

/**
 * Карточка товара — плитка.
 *
 * Раньше карточки шли строками во всю ширину: снимок 128 на 128 слева,
 * текст справа. Заказчик попросил формат, привычный по магазинам
 * автотоваров, — плитки сеткой, где снимок сверху, а под ним название
 * и цена.
 *
 * У плитки меньше места под характеристики, чем у строки, поэтому в
 * карточке остались только те, по которым выбирают:
 *
 * - вырез бампера — единственное, что видно на машине снаружи, и первое,
 *   о чём спрашивают;
 * - тяговая нагрузка — по ней проверяют, потянет ли прицеп.
 *
 * Тип шара и вес ушли на страницу товара: они уточняют выбор, а не
 * определяют его.
 *
 * Бейдж наличия заметный намеренно: в каталоге рядом стоят позиции с
 * отгрузкой сегодня и под заказ на 1–6 месяцев. Если человек не увидит
 * разницу при заказе, он узнает о ней через полгода ожидания.
 */
export function ProductCard({ product }: { product: ProductRow }) {
  const bumper = BUMPER_LABEL[product.bumperCut]
  const display = productDisplayImage(product)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line-light bg-white transition-colors hover:border-accent">
      {/*
        Снимки фаркопов сняты на светлом фоне и часто с прозрачностью по
        краям. На белом они растворяются, поэтому подложка чуть темнее
        карточки, а кадр вписывается целиком, а не обрезается: у детали
        важна форма, и срезанный кронштейн делает её неузнаваемой.

        Все картинки свои, из public/images/products: либо изображение
        этого артикула от завода (kind: 'photo'), либо обобщённый
        рисунок по типу шара (kind: 'icon'). Ссылок на чужие серверы
        в карточках нет, см. product-image.ts.
      */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-paper-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={display.src}
          alt={
            display.kind === 'icon'
              ? `Тип шара: ${product.ballType ?? 'не указан'}`
              : `Фаркоп ${product.manufacturer} ${product.article}`
          }
          loading="lazy"
          className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04] ${
            display.kind === 'icon' ? 'p-9 opacity-70' : 'p-4'
          }`}
        />

        {display.kind === 'icon' ? (
          <span className="absolute inset-x-0 bottom-0 bg-white/85 px-3 py-1 text-center text-[11px] leading-[1.3] text-ink-muted">
            изображение обобщённое
          </span>
        ) : null}

        <span
          className={`absolute left-3 top-3 rounded px-2 py-1 text-[12px] font-medium ${
            product.inStock ? 'bg-in-stock/12 text-in-stock' : 'bg-on-order/12 text-on-order'
          }`}
        >
          {product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={urls.product(product.slug)}
          className="text-[15px] font-medium leading-[1.3] after:absolute after:inset-0 hover:text-accent"
        >
          {product.manufacturer} {product.article}
        </Link>

        {bumper || product.towLoadKg ? (
          <div className="mt-2 text-[13px] leading-[1.5] opacity-55">
            {[bumper, product.towLoadKg ? `${formatNumber(product.towLoadKg)} кг` : null]
              .filter(Boolean)
              .join(' · ')}
          </div>
        ) : null}

        {/*
          mt-auto прижимает цену к низу: у карточек в ряду названия разной
          длины, и без этого цены встают на разной высоте — глаз перестаёт
          их сравнивать.
        */}
        <div className="mt-auto pt-3 text-[20px] font-semibold">{formatPrice(product.price)}</div>
      </div>
    </article>
  )
}
