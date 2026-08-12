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
    <article className="flex gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-lg bg-surface-2 sm:flex">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={`Фаркоп ${product.article}`}
            className="h-full w-full rounded-lg object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-ink-dim">нет фото</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-[family-name:var(--font-display)] text-lg text-ink">
          {product.article}
        </div>
        <div className="mt-1 text-sm text-ink-muted">
          {product.manufacturer}
          {product.country ? ` · ${product.country}` : ''}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xl font-bold text-accent">{formatPrice(product.price)}</span>
          <span
            className={`rounded px-2 py-1 text-xs font-semibold ${
              product.inStock ? 'bg-in-stock/15 text-in-stock' : 'bg-on-order/15 text-on-order'
            }`}
          >
            {product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded border border-line px-2 py-1 text-xs text-ink-muted"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Узнать цену
          </button>
          <Link
            href={urls.product(product.slug)}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  )
}
