import Link from 'next/link'
import { formatNumber, formatPrice } from '@/catalog/format'
import type { ProductRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'

const BUMPER_LABEL: Record<ProductRow['bumperCut'], string | null> = {
  not_required: 'без выреза бампера',
  required: 'нужен вырез бампера',
  unknown: null,
}

/**
 * Карточка товара в списке.
 *
 * Бейдж наличия сделан заметным намеренно: в каталоге соседствуют товары
 * с отгрузкой сегодня и позиции под заказ на 1–6 месяцев. Если человек
 * не увидит разницу при заказе, он узнает о ней через полгода ожидания.
 *
 * Вся карточка — ссылка на товар, а «Узнать цену» лежит поверх неё
 * отдельной кнопкой. Строку целиком проще нажать, чем целиться в слово
 * «Подробнее», особенно с телефона.
 */
export function ProductCard({ product }: { product: ProductRow }) {
  const chips = [
    product.ballType ? `Шар ${product.ballType}` : null,
    product.towLoadKg && product.verticalLoadKg
      ? `${product.towLoadKg}/${product.verticalLoadKg} кг`
      : null,
    product.weightKg ? `${formatNumber(product.weightKg)} кг` : null,
    BUMPER_LABEL[product.bumperCut],
  ].filter((chip): chip is string => chip !== null)

  return (
    <article className="relative flex gap-5 rounded-[var(--radius-card)] border border-line-light bg-white p-5 transition-colors hover:border-accent">
      <div className="hidden h-32 w-32 shrink-0 items-center justify-center rounded-lg bg-paper-2 sm:flex">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={`Фаркоп ${product.article}`}
            className="h-full w-full rounded-lg object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-xs opacity-45">нет фото</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* Артикул 18/500, цена 22/600 — см. docs/typography.md */}
        <Link
          href={urls.product(product.slug)}
          className="text-[18px] font-medium after:absolute after:inset-0 hover:text-accent"
        >
          {product.article}
        </Link>

        <div className="mt-1 text-[13px] opacity-55">
          {product.manufacturer}
          {product.country ? ` · ${product.country}` : ''}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-[22px] font-semibold">{formatPrice(product.price)}</span>
          <span
            className={`rounded px-2 py-1 text-[12px] font-medium ${
              product.inStock ? 'bg-in-stock/12 text-in-stock' : 'bg-on-order/12 text-on-order'
            }`}
          >
            {product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded border border-line-light px-2 py-1 text-[12px] font-medium opacity-65"
            >
              {chip}
            </span>
          ))}
        </div>

        {/*
          `relative` поднимает кнопку над растянутой ссылкой карточки —
          иначе нажатие на неё уводило бы на страницу товара.
        */}
        <button
          type="button"
          className="relative mt-4 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Узнать цену
        </button>
      </div>
    </article>
  )
}
