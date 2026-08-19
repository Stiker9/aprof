import { RATING, REVIEWS } from '@/content/reviews'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

/**
 * О нас и отзывы.
 *
 * Объединены в одну секцию намеренно: по отдельности «о компании»
 * превращается в набор утверждений о себе, а отзывы — в блок без
 * контекста. Вместе цифры получают подтверждение прямо под собой.
 *
 * Разметки AggregateRating здесь нет и не будет, пока отзывы
 * придуманные — см. src/content/reviews.ts.
 */
function Stars() {
  return (
    <span aria-hidden className="text-accent">
      ★★★★★
    </span>
  )
}

export function About() {
  return (
    <Section tone="light">
      <Eyebrow>О нас</Eyebrow>
      <SectionTitle>С 2014 года</SectionTitle>
      <SectionLead>
        Один сервис на Софийской, свои мастера и свой склад. Без посредников и подрядчиков.
      </SectionLead>

      {/* Кегль clamp(30,3.1vw,42) — роль «Цифра» из дизайн-системы, gap 80px как в источнике */}
      <div className="mt-14 flex flex-wrap gap-x-20 gap-y-8">
        <div className="flex flex-col gap-2">
          <div className="font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] leading-none tracking-[-0.02em]">
            12
          </div>
          <div className="text-[13px] opacity-60">лет</div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] leading-none tracking-[-0.02em]">
            3 800
          </div>
          <div className="text-[13px] opacity-60">установок</div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <span className="font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] leading-none tracking-[-0.02em]">
              {RATING.score}
            </span>
            <Stars />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[13px] opacity-60">рейтинг</div>
            <div className="text-xs opacity-45">{RATING.count} отзывов</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] leading-none tracking-[-0.02em]">
            2 года
          </div>
          <div className="text-[13px] opacity-60">гарантии</div>
        </div>
      </div>

      {/*
        На главной три отзыва, остальные — на своей странице. Цитата
        набрана заголовочным Unbounded 26px, не текстовым 19px: отзывы
        в макете читаются как журнальный разворот, а не как список
        карточек, и крупный заголовочный шрифт держит этот тон.
      */}
      <div className="mt-[72px] flex flex-col gap-[72px] lg:flex-row lg:gap-14">
        {REVIEWS.slice(0, 3).map((review) => (
          <figure key={review.author} className="flex flex-1 gap-6">
            <span
              aria-hidden
              className="shrink-0 font-[family-name:var(--font-display)] text-[48px] leading-[0.7] text-[#D5D2CD]"
            >
              «
            </span>
            <div className="flex flex-col gap-4">
              <blockquote className="font-[family-name:var(--font-display)] text-[26px] leading-[1.3] tracking-[-0.01em]">
                {review.text}
              </blockquote>
              <figcaption className="text-[13px] opacity-55">
                {review.author} · {review.car} · {review.date}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-baseline justify-between gap-6">
        <ArrowLink href="/otzyvy">Все отзывы</ArrowLink>
        <p className="text-sm opacity-55">
          Сертификат СТО · ГОСТ Р · Допуск на электромонтажные работы
        </p>
      </div>
    </Section>
  )
}
