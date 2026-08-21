import Image from 'next/image'
import { ArrowLink } from '@/components/ui/arrow-link'
import { PhotoStrip } from '@/components/ui/photo-strip'

/**
 * Наши работы.
 *
 * Восемь снимков из сервиса — те же файлы, что на странице /nashi-raboty,
 * отобраны разные марки. Порядок не случайный: светлые и тёмные кузова
 * чередуются, иначе несколько белых машин подряд сливаются в одно пятно.
 *
 * Марки взяты с шильдиков на самих фотографиях. Артикул фаркопа нигде не
 * подписан: на снимках его почти никогда не видно, а выдумывать номер на
 * сайте, где по нему подбирают деталь, нельзя.
 */
interface Work {
  car: string
  photo: string
}

const WORKS: Work[] = [
  { car: 'Mazda CX-5', photo: '/images/gallery/mazda-cx5.webp' },
  { car: 'Chery Tiggo 8 Pro Max', photo: '/images/gallery/chery-tiggo-8-pro-max.webp' },
  { car: 'Skoda Superb', photo: '/images/gallery/skoda-superb.webp' },
  { car: 'Geely Belgee X70', photo: '/images/gallery/geely-belgee-x70.webp' },
  { car: 'Audi SQ8', photo: '/images/gallery/audi-sq8.webp' },
  { car: 'Lexus NX', photo: '/images/gallery/lexus-nx.webp' },
  { car: 'Renault Duster', photo: '/images/gallery/renault-duster.webp' },
  { car: 'BMW X6', photo: '/images/gallery/bmw-x6.webp' },
]

export function Works() {
  return (
    <section className="overflow-hidden rounded-[var(--radius-block)] bg-surface text-ink">
      <div className="w-full px-5 pt-14 sm:px-8 sm:pt-20 lg:px-14 lg:pt-[clamp(52px,7vh,88px)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-dim">Работы</p>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
          Галерея работ
        </h2>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-[1.55] text-ink-muted">
          Фотографии с нашего подъёмника. Найдите свою модель и посмотрите,
          как фаркоп выглядит вживую.
        </p>
      </div>

      {/*
        Снимки лежат прямо на фоне, без рамок и скруглений — так задано
        макетом. Высота кадра тоже оттуда: 42vh с ограничителями снизу и
        сверху, а не фиксированная. Снимки вертикальные, с телефона, и в
        такое окно попадает задняя часть машины с фаркопом — то, ради
        чего кадр и снят.
      */}
      <PhotoStrip className="mt-12" ariaLabel="Наши работы">
        {WORKS.map((work) => (
          <figure
            key={work.photo}
            className="w-[280px] shrink-0 snap-start md:w-[360px]"
          >
            <div className="relative flex h-[clamp(240px,42vh,420px)] items-center justify-center overflow-hidden bg-surface-2 text-xs text-ink-dim">
              <Image
                src={work.photo}
                alt={`Установленный фаркоп на ${work.car}`}
                fill
                sizes="360px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-ink-muted">
              {work.car}
            </figcaption>
          </figure>
        ))}
      </PhotoStrip>

      <div className="w-full px-5 pb-14 pt-10 sm:px-8 sm:pb-20 lg:px-14 lg:pb-[clamp(52px,7vh,88px)]">
        <ArrowLink href="/nashi-raboty" muted="больше 3 800 установок">
          Все работы
        </ArrowLink>
      </div>
    </section>
  )
}
