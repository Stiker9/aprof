import Image from 'next/image'
import Link from 'next/link'
import { PROMOS, type Promo, type PromoPeriod } from '@/content/promos'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionTitle } from '@/components/ui/section'

/**
 * Акции.
 *
 * Раскладка неравная: первая акция занимает большую карточку с
 * фотографией, две другие — узкие справа. Это не декорация, а
 * расстановка приоритетов — главная акция месяца должна читаться
 * первой, а не теряться среди трёх одинаковых плиток.
 */
const PHOTO_OVERLAY =
  'linear-gradient(rgba(13,13,14,0.72) 0%, rgba(13,13,14,0.15) 34%, rgba(13,13,14,0.85) 100%)'

function Period({ period }: { period: PromoPeriod }) {
  if (period.kind === 'until') {
    return (
      <span className="inline-block rounded bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
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

/** Большая карточка с фотографией — первая акция в списке. */
function FeaturedPromo({ promo }: { promo: Promo }) {
  return (
    <article className="relative isolate flex min-h-[547px] flex-col justify-end overflow-hidden rounded-[var(--radius-block)] bg-surface p-8">
      {/*
        Фоном стоит монтажная схема, а не фотография машины: акция про
        установку, и чертёж крепления говорит об этом точнее, чем ещё
        один снимок кузова, которых на странице и так хватает.
      */}
      <Image
        src="/images/promo-scheme.webp"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="-z-10 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10" style={{ background: PHOTO_OVERLAY }} />

      <div className="absolute left-8 top-8">
        <Period period={promo.period} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-[clamp(24px,3vw,30px)] leading-tight tracking-[-0.02em] text-ink">
            {promo.title}
          </h3>
          <p className="mt-3 max-w-[40ch] text-[15px] text-ink-muted">{promo.lead}</p>
          <div className="mt-6">
            <ArrowLink href={promo.action.href}>{promo.action.label}</ArrowLink>
          </div>
        </div>

        {promo.kind === 'text' && (
          <div className="text-right">
            <div className="font-[family-name:var(--font-display)] text-[clamp(40px,6vw,58px)] leading-none tracking-[-0.03em] text-accent-bright">
              {promo.discount}
            </div>
            <div className="mt-2 text-sm text-ink-muted">{promo.discountNote}</div>
          </div>
        )}
      </div>
    </article>
  )
}

/** Узкая карточка без фотографии. */
function SidePromo({ promo }: { promo: Promo }) {
  return (
    <article className="flex min-h-[266px] flex-col rounded-[var(--radius-block)] border border-white/6 bg-surface-2 p-6">
      <Period period={promo.period} />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-[19px] leading-tight tracking-[-0.02em] text-ink">
            {promo.title}
          </h3>
          <p className="mt-1.5 text-[13px] text-ink-muted">{promo.lead}</p>
        </div>

        {promo.kind === 'text' && (
          <div className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.02em] text-accent-bright">
            {promo.discount}
          </div>
        )}
      </div>

      {promo.kind === 'list' && (
        <ul className="mt-4">
          {promo.items.map((item) => (
            <li
              key={item.model}
              className="flex items-baseline justify-between gap-4 border-b border-white/6 py-1.5 text-[13px] last:border-0"
            >
              <span className="text-ink">{item.model}</span>
              <span className="text-accent-bright">{item.discount}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <Link href={promo.action.href} className="text-[13px] text-accent hover:text-accent-hover">
          {promo.action.label} →
        </Link>
      </div>
    </article>
  )
}

export function Promos() {
  // Пустой список — секции нет совсем: заголовок над пустотой хуже,
  // чем её отсутствие.
  if (PROMOS.length === 0) return null

  const [featured, ...rest] = PROMOS

  return (
    <Section tone="dark-2">
      <div className="flex flex-wrap items-baseline justify-between gap-6">
        <div>
          <Eyebrow>Акции</Eyebrow>
          <SectionTitle>Выгоднее сейчас</SectionTitle>
        </div>
        <ArrowLink href="/akcii">Все акции</ArrowLink>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-[699fr_466fr]">
        <FeaturedPromo promo={featured} />
        <div className="grid gap-4 lg:grid-rows-2">
          {rest.map((promo) => (
            <SidePromo key={promo.slug} promo={promo} />
          ))}
        </div>
      </div>
    </Section>
  )
}
