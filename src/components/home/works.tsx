import { ArrowLink } from '@/components/ui/arrow-link'

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
}

const WORKS: Work[] = [
  { car: 'Toyota RAV4 XA50', article: 'T110-A' },
  { car: 'Hyundai Creta I', article: 'H231-A' },
  { car: 'Kia Sportage IV', article: 'K126-A' },
  { car: 'Renault Duster II', article: 'R118-A' },
  { car: 'Volkswagen Tiguan II', article: 'V211-A' },
  { car: 'Lada Vesta SW Cross', article: 'L041-A' },
]

/**
 * Отступ слева равен отступу контента: лента начинается по одной линии
 * с заголовком, а справа уходит за край экрана — так видно, что она
 * продолжается, без стрелок и точек.
 */
const STRIP_PADDING = 'pl-[max(1.5rem,calc((100%-1400px)/2+1.5rem))]'

export function Works() {
  return (
    <section className="bg-surface text-ink">
      <div className="mx-auto w-full max-w-[1400px] px-6 pt-20 md:pt-28">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim">Работы</p>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(26px,4vw,34px)] leading-tight tracking-[-0.03em]">
          Три машины в день
        </h2>
        <p className="mt-4 max-w-[60ch] text-[17px] text-ink-muted">
          Снимаем каждую установку — посмотрите, как фаркоп выглядит именно на вашей модели.
        </p>
      </div>

      <div className={`mt-12 flex gap-5 overflow-x-auto pb-2 pr-6 ${STRIP_PADDING}`}>
        {WORKS.map((work) => (
          <figure key={work.article} className="w-[280px] shrink-0 md:w-[340px]">
            <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-card)] border border-line bg-surface-2 text-xs text-ink-dim">
              фото скоро
            </div>
            <figcaption className="mt-3 text-sm text-ink-muted">
              {work.car} · <span className="text-ink-dim">{work.article}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-6 pb-20 pt-10 md:pb-28">
        <ArrowLink href="/nashi-raboty" muted="больше 3 800 установок">
          Все работы
        </ArrowLink>
      </div>
    </section>
  )
}
