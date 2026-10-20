import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { PROMOS, type Promo } from '@/content/promos'

export const metadata: Metadata = {
  title: 'Акции на фаркопы и установку в Санкт-Петербурге',
  description:
    'Действующие скидки на фаркопы и установку: акция месяца, скидка за друга и модели со сниженной ценой на монтаж.',
  alternates: { canonical: absolute('/akcii') },
}

function Period({ promo }: { promo: Promo }) {
  if (promo.period.kind === 'until') {
    return (
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        {promo.period.label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-55">
      <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-in-stock" />
      Действует постоянно
    </span>
  )
}

export default function PromosPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Акции' }]}
      title="Акции"
      summary="Скидки действуют на работы. Стоимость самого фаркопа берётся из каталога."
    >
      {PROMOS.length === 0 ? (
        <p className="mt-10 opacity-60">Сейчас действующих акций нет.</p>
      ) : (
        <div className="mt-10 grid items-start gap-4 md:grid-cols-3">
          {PROMOS.map((promo) => (
            <article
              key={promo.slug}
              className="flex h-full flex-col rounded-[var(--radius-block)] border border-line-light bg-white p-7"
            >
              <Period promo={promo} />

              <h2 className="mt-5 font-[family-name:var(--font-display)] text-[22px] leading-tight tracking-[-0.02em]">
                {promo.title}
              </h2>

              <p className="mt-3 text-[15px] opacity-65">{promo.lead}</p>

              {promo.kind === 'list' ? (
                <ul className="mt-7 border-t border-line-light">
                  {promo.items.map((item) => (
                    <li
                      key={item.model}
                      className="flex items-baseline justify-between gap-4 border-b border-line-light py-2.5 text-sm"
                    >
                      <span>{item.model}</span>
                      <span className="font-semibold text-accent">{item.discount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-7">
                  <div className="font-[family-name:var(--font-display)] text-[clamp(34px,5vw,44px)] leading-none tracking-[-0.02em] text-accent">
                    {promo.discount}
                  </div>
                  <div className="mt-2 text-sm opacity-60">{promo.discountNote}</div>
                </div>
              )}

              <div className="mt-auto pt-8">
                <Link href={promo.action.href} className="text-accent hover:underline">
                  {promo.action.label} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-12 max-w-[70ch] text-sm opacity-55">
        Скидки не суммируются между собой. Условия каждой уточняйте при записи — на редких моделях
        объём работ отличается.
      </p>
    </CatalogShell>
  )
}
