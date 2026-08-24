'use client'

import Link from 'next/link'
import { LayoutGrid } from '@/components/ui/layout-grid'

/**
 * Галерея работ на раскладке-сетке из 21st.dev.
 *
 * Слой между нашими данными и внешним компонентом: тот ждёт карточки
 * с полями id, content, className и thumbnail, а у нас снимки описаны
 * маркой машины и адресом её страницы в каталоге.
 *
 * Часть карточек занимает два ряда в высоту, остальные один. Растягивать
 * их в ширину, как в исходном примере, нельзя: снимки сняты телефоном
 * вертикально, и в широкую низкую рамку машина не помещается — остаётся
 * полоска бампера. Высокая карточка, наоборот, повторяет пропорции кадра.
 *
 * Дыры от высоких карточек закрывает плотная укладка (grid-flow-dense)
 * в самой сетке.
 */
export interface WorkPhoto {
  car: string
  photo: string
  /** Страница фаркопов для этой машины. Нет у крупных планов узла. */
  href?: string
  /** Производитель фаркопа — только если виден на снимке. */
  article?: string
}

const SPANS = ['row-span-2', '', '', 'row-span-2', '', 'row-span-2', '', '']

export function WorksGrid({ photos }: { photos: WorkPhoto[] }) {
  const cards = photos.map((photo, index) => ({
    id: index,
    className: SPANS[index % SPANS.length],
    thumbnail: photo.photo,
    content: (
      <div>
        <p className="text-xl font-bold text-white md:text-3xl">{photo.car}</p>
        {photo.article ? (
          <p className="mt-1 text-base text-neutral-300">Фаркоп {photo.article}</p>
        ) : null}

        {/*
          Ссылка ведёт на страницу фаркопов для этой машины, а не на
          карточку конкретного товара: какая именно модель стоит на
          снимке, мы не знаем — на фотографиях её не видно.
        */}
        {photo.href ? (
          <Link
            href={photo.href}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Фаркопы на {photo.car} <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
    ),
  }))

  return <LayoutGrid cards={cards} />
}
