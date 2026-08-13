import type { ReactNode } from 'react'

/** Чип характеристики: тип шара, нагрузка, масса. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-line px-2 py-1 text-xs text-ink-muted">{children}</span>
  )
}

/**
 * Бейдж наличия.
 *
 * Зелёный против янтарного — не украшение: в каталоге рядом стоят товары
 * с отгрузкой сегодня и позиции под заказ на 1–6 месяцев. Если человек
 * не заметит разницу при заказе, он узнает о ней через полгода ожидания.
 */
export function StockBadge({ inStock, children }: { inStock: boolean; children: ReactNode }) {
  return (
    <span
      className={`rounded px-2 py-1 text-xs font-semibold ${
        inStock ? 'bg-in-stock/15 text-in-stock' : 'bg-on-order/15 text-on-order'
      }`}
    >
      {children}
    </span>
  )
}
