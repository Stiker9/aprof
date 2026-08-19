import Image from 'next/image'
import Link from 'next/link'
import { PROMOS, type Promo } from '@/content/promos'
import { Section } from '@/components/ui/section'

/**
 * Акции.
 *
 * Раскладка неравная: акция месяца занимает большую карточку с
 * фотографией, «приведи друга» — карточку поменьше тоже с фотографией,
 * а список моделей — плоскую плитку без снимка. Это расстановка
 * приоритетов, а не украшение: главная акция должна читаться первой,
 * а не теряться среди трёх одинаковых плиток.
 *
 * Список моделей нарочно без фотографии — в нём смотрят на строки со
 * скидками, и снимок за ними только мешал бы читать.
 */
const OVERLAY_LARGE =
  'linear-gradient(180deg, rgba(13,13,14,.72) 0%, rgba(13,13,14,.15) 34%, rgba(13,13,14,.88) 100%)'
const OVERLAY_SMALL =
  'linear-gradient(180deg, rgba(13,13,14,.6) 0%, rgba(13,13,14,.2) 40%, rgba(13,13,14,.9) 100%)'

/** Срок с датой — красная пилюля: ради неё торопятся. */
function DeadlineBadge({ label }: { label: string }) {
  return (
    <span className="self-start rounded-full bg-[#E63329] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em]">
      {label}
    </span>
  )
}

/**
 * Бессрочная акция — стеклянная пилюля с зелёной точкой.
 *
 * Без точки «постоянно» читается как такой же дедлайн, только без числа.
 */
function PermanentBadge() {
  return (
    <span className="inline-flex self-start items-center gap-2 rounded-full bg-white/14 px-[13px] py-[7px] text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-[6px]">
      <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
      Постоянно
    </span>
  )
}

/** Большая карточка акции месяца — с фотографией и белой кнопкой. */
function FeaturedPromo({ promo }: { promo: Promo }) {
  return (
    <article className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[var(--radius-block)] bg-[#131316]">
      <Image
        src="/images/promo-scheme.webp"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: OVERLAY_LARGE }} />

      <div className="relative z-[1] flex flex-1 flex-col gap-4 px-[clamp(22px,3vw,32px)] pb-[clamp(22px,3.4vh,32px)] pt-[clamp(20px,3vh,28px)]">
        {promo.period.kind === 'until' ? (
          <DeadlineBadge label={promo.period.label} />
        ) : (
          <PermanentBadge />
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <h3 className="font-[family-name:var(--font-display)] text-[clamp(28px,3vw,36px)] leading-[1.05] tracking-[-0.025em]">
              {promo.title}
            </h3>
            <p className="max-w-[380px] text-base leading-[1.45] text-white/72">{promo.lead}</p>
            <Link
              href={promo.action.href}
              className="mt-2 inline-flex items-center gap-2.5 self-start rounded-full bg-white px-6 py-3.5 text-[15px] font-bold text-[#0D0D0E] transition-colors hover:bg-white/86"
            >
              {promo.action.label} <span aria-hidden>→</span>
            </Link>
          </div>

          {promo.kind === 'text' && (
            <div className="shrink-0 text-right">
              <div className="font-[family-name:var(--font-display)] text-[clamp(52px,6vw,76px)] leading-[.85] tracking-[-0.05em] text-accent-bright">
                {promo.discount}
              </div>
              <div className="mt-1.5 text-[13px] text-white/50">{promo.discountNote}</div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/** Средняя карточка с фотографией: заголовок и скидка в одну строку. */
function PhotoPromo({ promo }: { promo: Promo }) {
  return (
    <article className="relative flex min-h-[200px] flex-col overflow-hidden rounded-[var(--radius-block)] bg-[#131316]">
      <Image
        src="/images/work-kodiaq.webp"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 40vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: OVERLAY_SMALL }} />

      <div className="relative z-[1] flex flex-1 flex-col gap-2.5 px-[26px] py-[22px]">
        {promo.period.kind === 'until' ? (
          <DeadlineBadge label={promo.period.label} />
        ) : (
          <PermanentBadge />
        )}

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <h3 className="mb-[5px] font-[family-name:var(--font-display)] text-[24px] leading-[1.1] tracking-[-0.02em]">
              {promo.title}
            </h3>
            <p className="text-sm leading-[1.4] text-white/68">{promo.lead}</p>
          </div>

          {promo.kind === 'text' && (
            <div className="shrink-0 font-[family-name:var(--font-display)] text-[38px] leading-[.9] tracking-[-0.04em] text-accent-bright">
              {promo.discount}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/** Плитка со списком моделей — без фотографии и без метки срока. */
function ListPromo({ promo }: { promo: Promo }) {
  if (promo.kind !== 'list') return null

  return (
    <article className="flex flex-col gap-3.5 rounded-[var(--radius-block)] border border-white/8 bg-[#16161A] px-[26px] py-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[19px] font-bold leading-[1.2] tracking-[-0.01em]">{promo.title}</h3>
        <p className="text-[13px] leading-[1.4] text-white/45">{promo.lead}</p>
      </div>

      <div className="flex flex-col">
        {promo.items.map((item) => (
          <div
            key={item.model}
            className="flex items-baseline justify-between gap-3 border-t border-white/8 py-[11px]"
          >
            <span className="text-[15px] font-medium">{item.model}</span>
            <span className="text-sm font-bold text-accent-bright">{item.discount}</span>
          </div>
        ))}
      </div>

      <Link
        href={promo.action.href}
        className="mt-auto inline-flex items-center gap-2 self-start text-sm font-semibold text-white/75 transition-colors hover:text-white"
      >
        {promo.action.label} <span className="text-accent-bright">→</span>
      </Link>
    </article>
  )
}

export function Promos() {
  // Пустой список — секции нет совсем: заголовок над пустотой хуже,
  // чем её отсутствие.
  if (PROMOS.length === 0) return null

  const [featured, second, third] = PROMOS

  return (
    <Section tone="dark-2">
      {/*
        Ссылка выровнена по нижней линии заголовка, а не по первой:
        заголовок крупный, и по верху ссылка висела бы в пустоте.
      */}
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Акции</p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,3.3vw,44px)] leading-[1.02] tracking-[-0.03em]">
            Выгоднее сейчас
          </h2>
        </div>

        <Link
          href="/akcii"
          className="inline-flex items-center gap-2.5 border-b border-white/25 pb-1.5 text-[15px] font-bold transition-colors hover:border-accent-hover"
        >
          Все акции <span className="text-[17px] text-accent-bright">→</span>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <FeaturedPromo promo={featured} />

        <div className="grid gap-4 lg:grid-rows-2">
          {second ? <PhotoPromo promo={second} /> : null}
          {third ? <ListPromo promo={third} /> : null}
        </div>
      </div>
    </Section>
  )
}
