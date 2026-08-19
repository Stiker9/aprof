import Image from 'next/image'
import { ArrowLink } from '@/components/ui/arrow-link'
import { PhotoStrip } from '@/components/ui/photo-strip'

/**
 * Наши работы.
 *
 * Фотографий пока нет: в базе только снимки товаров с чужого сайта,
 * а установленные фаркопы на машинах есть лишь у заказчика. Здесь
 * стоят заглушки с настоящими подписями — марка, модель, артикул, —
 * чтобы раскладка была готова к подстановке снимков, и чтобы никто
 * не принял пустой блок за готовый.
 */
interface Work {
  car: string
  article: string
  /** Снимок из макета. Там он один — остальные ждут фотографий заказчика. */
  photo?: string
}

const WORKS: Work[] = [
  { car: 'Skoda Kodiaq', article: 'Bosal S-124', photo: '/images/work-kodiaq.webp' },
  { car: 'Toyota RAV4 XA50', article: 'Galia T030A' },
  { car: 'Hyundai Creta I', article: 'Halty H.T97' },
  { car: 'Kia Sportage IV', article: 'Steinhof K-045' },
  { car: 'Volkswagen Tiguan II', article: 'Oris 3247-A' },
  { car: 'Lada Vesta SW Cross', article: 'Лидер-плюс L-102' },
]

export function Works() {
  return (
    <section className="overflow-hidden rounded-[var(--radius-block)] bg-surface text-ink">
      <div className="w-full px-5 pt-14 sm:px-8 sm:pt-20 lg:px-14 lg:pt-[clamp(52px,7vh,88px)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-dim">Работы</p>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
          Три машины в день
        </h2>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-[1.55] text-ink-muted">
          Снимаем каждую установку — посмотрите, как фаркоп выглядит именно на вашей модели.
        </p>
      </div>

      {/*
        Снимки лежат прямо на фоне, без рамок и скруглений — так задано
        макетом. Кадр широкий, 520×333: фаркоп снимают вместе с задней
        частью машины, в квадрат это не помещается.
      */}
      <PhotoStrip className="mt-12" ariaLabel="Наши работы">
        {WORKS.map((work) => (
          <figure
            key={work.article}
            className="w-[360px] shrink-0 snap-start md:w-[520px]"
          >
            <div className="relative flex aspect-[520/333] items-center justify-center overflow-hidden bg-surface-2 text-xs text-ink-dim">
              {work.photo ? (
                <Image
                  src={work.photo}
                  alt={`Фаркоп ${work.article} на ${work.car}`}
                  fill
                  sizes="520px"
                  className="object-cover"
                />
              ) : (
                'фото скоро'
              )}
            </div>
            <figcaption className="mt-3 text-sm text-ink-muted">
              {work.car} · <span className="text-ink-dim">{work.article}</span>
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
