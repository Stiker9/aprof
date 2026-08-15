import type { Metadata } from 'next'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { RATING, REVIEWS } from '@/content/reviews'

export const metadata: Metadata = {
  title: 'Отзывы об установке фаркопов — AUTOPROFI',
  description:
    'Что пишут после установки фаркопа: сроки, работа с электрикой, документы для ТО, доставка в другие города.',
  alternates: { canonical: absolute('/otzyvy') },
}

/**
 * Отзывы.
 *
 * Разметки AggregateRating здесь нет и не будет, пока отзывы
 * придуманные: это сведения о товаре в поисковой выдаче, за которые
 * отвечает заказчик, а не украшение сниппета. Появится вместе
 * с настоящими отзывами — см. src/content/reviews.ts.
 */
export default function ReviewsPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Отзывы' }]}
      title="Отзывы"
      summary={`${RATING.score} — средняя оценка по ${RATING.count} отзывам`}
    >
      <div className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((review) => (
          <figure key={`${review.author}-${review.car}`}>
            <span
              aria-hidden
              className="block font-[family-name:var(--font-display)] text-4xl leading-none opacity-20"
            >
              «
            </span>
            <blockquote className="mt-3 text-[18px] leading-[1.5]">{review.text}</blockquote>
            <figcaption className="mt-5 text-sm opacity-55">
              {review.author} · {review.car} · {review.date}
            </figcaption>
          </figure>
        ))}
      </div>

      {/*
        Строки о происхождении отзывов здесь намеренно нет. Написать
        «собраны из карточки организации» значило бы указать источник,
        которого не существует: тексты придуманы для вёрстки. Появится
        вместе с настоящими отзывами.
      */}
    </CatalogShell>
  )
}
