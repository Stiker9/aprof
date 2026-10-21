'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

/**
 * Галерея работ: крупные кадры, подпись под фотографией.
 *
 * Раньше здесь была сетка из пяти колонок с подписью и кнопкой поверх
 * снимка и градиентом внизу: кадр получался около 250 пикселей, фаркоп
 * на нём — деталью размером с ноготь, а затемнение съедало нижнюю треть
 * фотографии. Заказчику это и не нравилось.
 *
 * Теперь кадр 4:5 — почти та же пропорция, что у исходников 960×1280,
 * поэтому фотография не режется, а подпись ушла под кадр: её видно
 * всегда, а не только там, где хватило контраста.
 *
 * Точка обрезки берётся из данных, своя на каждый снимок: фаркопы стоят
 * на разной высоте (от 0.61 до 0.73 высоты кадра), и одна общая точка
 * неизбежно теряла бы половину из них. object-position в процентах
 * совмещает точку снимка с той же точкой рамки.
 *
 * Ссылок двенадцать, каждая ведёт на страницу модели: для поиска это
 * двенадцать внутренних переходов с осмысленным текстом, для человека —
 * «а вдруг моя машина».
 */
export interface GalleryWork {
  car: string
  photo: string
  /** Страница фаркопов для этой машины. Нет у крупных планов узла. */
  href?: string
  /** Производитель фаркопа — только если виден на снимке. */
  article?: string
  /** Зачем ставили фаркоп. Заглушка: на снимках этого не написано. */
  use?: string
  /** Надпись на кнопке у крупного кадра. */
  cta?: string
  /** Тип кузова для фильтра. */
  body?: 'Кроссоверы' | 'Седаны' | 'Универсалы'
  /** Где на снимке фаркоп — доля высоты кадра. */
  focus?: number
}

const FILTERS = ['Все', 'Кроссоверы', 'Седаны', 'Универсалы'] as const

export function WorksGallery({
  works,
  allHref,
  total,
}: {
  works: GalleryWork[]
  allHref: string
  /** Сколько установок сделано всего — цифра компании, не число снимков. */
  total: string
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Все')

  const shown = useMemo(
    () => (filter === 'Все' ? works : works.filter((work) => work.body === filter)),
    [filter, works],
  )

  return (
    <section className="overflow-hidden bg-paper-2 text-ink-dark">
      <div className="w-full px-5 py-12 sm:px-8 sm:py-14 lg:px-14 lg:py-[clamp(40px,5vh,64px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-dark/80">Работы</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
              Галерея работ
            </h2>
            <p className="mt-3 max-w-[52ch] text-[17px] leading-[1.55] text-[#444442]">
              Фотографии с нашего подъёмника. Найдите свою модель и посмотрите, как фаркоп выглядит
              вживую.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <b className="block font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] font-normal leading-none tracking-[-0.02em]">
              {total}
            </b>
            <span className="mt-2 block text-sm text-[#444442]">установок с 2014 года</span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Фильтр по типу кузова">
          {FILTERS.map((name) => {
            const active = filter === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => setFilter(name)}
                aria-pressed={active}
                className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent text-accent-soft'
                    : 'border-ink-dark/20 text-[#444442] hover:border-ink-dark hover:text-ink-dark'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>

        {/*
          Два ряда по пять — ровно десять кадров. Двенадцатый и
          одиннадцатый замыкали третий ряд двумя плитками, и секция
          заканчивалась неровным хвостом. Остальные работы — по ссылке
          «Все работы».
        */}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
          {shown.slice(0, 10).map((work) => (
            <Link
              key={work.photo}
              href={work.href ?? '/farkopy'}
              className="group flex flex-col gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[#E4E1DC]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={work.photo}
                  alt={`Фаркоп на ${work.car}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  style={{ objectPosition: `50% ${(work.focus ?? 0.68) * 100}%` }}
                />
              </div>

              <div className="flex flex-1 justify-between gap-3">
                <div className="flex flex-1 flex-col">
                  <span className="font-[family-name:var(--font-display)] text-[16px] leading-[1.2] tracking-[-0.01em]">
                    {work.car}
                  </span>
                  <span className="mt-auto pt-1.5 text-[13px] text-[#444442]">
                    {work.body ? `${work.body} · ` : ''}
                    3 часа
                  </span>
                </div>
                <span
                  aria-hidden
                  className="mt-1 shrink-0 text-[15px] text-[#555553] transition-colors group-hover:text-accent"
                >
                  ↗
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            href={allHref}
            className="inline-flex items-center gap-3 rounded-full border border-ink-dark/20 px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink-dark"
          >
            Все работы <span className="opacity-75" aria-hidden>→</span>
          </Link>
          <span className="text-sm text-[#444442]">
            Не нашли свою модель — позвоните, проверим по каталогу
          </span>
        </div>
      </div>
    </section>
  )
}
