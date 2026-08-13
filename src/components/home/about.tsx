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

      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-[family-name:var(--font-display)] text-[clamp(30px,4vw,42px)] leading-none tracking-[-0.02em]">
            12 лет
          </div>
          <div className="mt-2 text-sm opacity-60">на одном месте</div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-display)] text-[clamp(30px,4vw,42px)] leading-none tracking-[-0.02em]">
            3 800
          </div>
          <div className="mt-2 text-sm opacity-60">установок</div>
        </div>
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-[family-name:var(--font-display)] text-[clamp(30px,4vw,42px)] leading-none tracking-[-0.02em]">
              {RATING.score}
            </span>
            <Stars />
          </div>
          <div className="mt-2 text-sm opacity-60">
            средняя оценка · {RATING.count} отзывов
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-display)] text-[clamp(30px,4vw,42px)] leading-none tracking-[-0.02em]">
            2 года
          </div>
          <div className="mt-2 text-sm opacity-60">гарантии на работы</div>
        </div>
      </div>

      <div className="mt-20 grid gap-12 lg:grid-cols-3">
        {REVIEWS.map((review) => (
          <figure key={review.author}>
            {/* Кавычка декоративная: её роль берёт на себя blockquote */}
            <span aria-hidden className="block font-[family-name:var(--font-display)] text-4xl leading-none opacity-25">
              «
            </span>
            <blockquote className="mt-3 text-[19px] leading-[1.5]">{review.text}</blockquote>
            <figcaption className="mt-5 text-sm opacity-55">
              {review.author} · {review.car} · {review.date}
            </figcaption>
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
