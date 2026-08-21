import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'

export const metadata: Metadata = {
  title: 'Наши работы — установленные фаркопы',
  description:
    'Фотографии установленных фаркопов с указанием марки и модели автомобиля. Больше 3 800 установок с 2014 года.',
  alternates: { canonical: absolute('/nashi-raboty') },
}

/**
 * Настоящие снимки установок из сервиса — 19 работ, снятых на подъёмнике.
 *
 * Марки указаны по шильдикам на самих фотографиях, а не выдуманы. Модель
 * фаркопа проставлена только там, где её видно на снимке (шильдик или
 * наклейка на кронштейне): подписывать артикул наугад для сайта, где по
 * нему подбирают деталь, значит вводить человека в заблуждение.
 *
 * Порядок не случайный: светлые и тёмные кузова чередуются. Подряд
 * несколько белых машин в сетке сливаются в одно пятно.
 *
 * Три кадра — крупные планы самого узла без машины в кадре; у них в
 * подписи стоит то, что на них изображено.
 */
interface Work {
  /** Марка и модель по шильдику, либо описание для крупного плана. */
  car: string
  /** Производитель фаркопа — только если виден на снимке. */
  article?: string
  photo: string
}

const WORKS: Work[] = [
  { car: 'Chery Tiggo 8 Pro Max', photo: '/images/gallery/chery-tiggo-8-pro-max.webp' },
  { car: 'Mazda CX-5', photo: '/images/gallery/mazda-cx5.webp' },
  { car: 'Geely Belgee X70', photo: '/images/gallery/geely-belgee-x70.webp' },
  { car: 'Skoda Superb', photo: '/images/gallery/skoda-superb.webp' },
  { car: 'Lexus NX', photo: '/images/gallery/lexus-nx.webp' },
  { car: 'Audi SQ8', photo: '/images/gallery/audi-sq8.webp' },
  { car: 'BMW X6', photo: '/images/gallery/bmw-x6.webp' },
  { car: 'Renault Duster', photo: '/images/gallery/renault-duster.webp' },
  { car: 'Haval F7', photo: '/images/gallery/haval-f7.webp' },
  { car: 'Mercedes-Benz', photo: '/images/gallery/mercedes-benz.webp' },
  { car: 'Nissan X-Trail', photo: '/images/gallery/nissan-x-trail.webp' },
  { car: 'Kia Rio', photo: '/images/gallery/kia-rio.webp' },
  { car: 'Haval M6', photo: '/images/gallery/haval-m6.webp' },
  { car: 'Skoda Rapid', photo: '/images/gallery/skoda-rapid.webp' },
  { car: 'Lada Largus', photo: '/images/gallery/lada-largus.webp' },
  { car: 'Audi SQ8', photo: '/images/gallery/audi-sq8-2.webp' },
  { car: 'Фаркоп с розеткой', article: 'Motodor', photo: '/images/gallery/detal-motodor.webp' },
  { car: 'Шар и посадочный квадрат', photo: '/images/gallery/detal-sharovaya.webp' },
  { car: 'Lada Largus', article: 'Berg', photo: '/images/gallery/detal-berg-largus.webp' },
]

export default function WorksPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Наши работы' }]}
      title="Галерея работ"
      summary="Фотографии с нашего подъёмника на Софийской. Найдите свою модель и посмотрите, как фаркоп выглядит вживую."
    >
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WORKS.map((work) => (
          <figure key={work.photo}>
            <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-line-light bg-white text-xs opacity-40">
              {work.photo ? (
                <Image
                  src={work.photo}
                  alt={work.article ? `Фаркоп ${work.article} на ${work.car}` : work.car}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                'фото скоро'
              )}
            </div>
            <figcaption className="mt-3 text-sm">
              {work.car}
              {work.article ? <span className="opacity-55"> · {work.article}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
        <div className="flex-1">
          <h2 className="text-[19px] font-medium">Не нашли свою модель?</h2>
          <p className="mt-2 max-w-[52ch] text-sm opacity-60">
            Здесь не все работы — машин через нас прошло больше 3 800. Позвоните,
            скажем сразу, делали ли вашу.
          </p>
        </div>
        <Link
          href={urls.catalog()}
          className="rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Подобрать фаркоп
        </Link>
      </div>
    </CatalogShell>
  )
}
