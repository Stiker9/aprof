import { PROMOS, type Promo, type PromoPeriod } from '@/content/promos'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionTitle } from '@/components/ui/section'

/**
 * Метка срока.
 *
 * У акции со сроком он красный и с датой — это то, ради чего человек
 * торопится. У постоянной вместо даты зелёная точка: без неё «действует
 * постоянно» читается как такой же дедлайн, только без числа.
 */
function Period({ period }: { period: PromoPeriod }) {
  if (period.kind === 'until') {
    return (
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-bright">
        {period.label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
      <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-in-stock" />
      Постоянно
    </span>
  )
}

function PromoCard({ promo }: { promo: Promo }) {
  return (
    <article className="flex flex-col rounded-[var(--radius-block)] border border-line bg-surface p-7">
      <Period period={promo.period} />

      <h3 className="mt-5 font-[family-name:var(--font-display)] text-[22px] leading-tight tracking-[-0.02em] text-ink">
        {promo.title}
      </h3>

      <p className="mt-3 text-[15px] text-ink-muted">{promo.lead}</p>

      {promo.kind === 'list' ? (
        <ul className="mt-7 border-t border-line">
          {promo.items.map((item) => (
            <li
              key={item.model}
              className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm"
            >
              <span className="text-ink">{item.model}</span>
              <span className="font-semibold text-accent-bright">{item.discount}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-7">
          <div className="font-[family-name:var(--font-display)] text-[clamp(34px,5vw,44px)] leading-none tracking-[-0.02em] text-accent-bright">
            {promo.discount}
          </div>
          <div className="mt-2 text-sm text-ink-muted">{promo.discountNote}</div>
        </div>
      )}

      {/* Ссылка прижата к низу, чтобы у карточек разной высоты она шла по одной линии */}
      <div className="mt-auto pt-8">
        <ArrowLink href={promo.action.href}>{promo.action.label}</ArrowLink>
      </div>
    </article>
  )
}

export function Promos() {
  // Пустой список — секции нет совсем: заголовок над пустотой хуже,
  // чем её отсутствие.
  if (PROMOS.length === 0) return null

  return (
    <Section tone="dark">
      <div className="flex flex-wrap items-baseline justify-between gap-6">
        <div>
          <Eyebrow>Акции</Eyebrow>
          <SectionTitle>Выгоднее сейчас</SectionTitle>
        </div>
        <ArrowLink href="/akcii">Все акции</ArrowLink>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PROMOS.map((promo) => (
          <PromoCard key={promo.slug} promo={promo} />
        ))}
      </div>
    </Section>
  )
}
