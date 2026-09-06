'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

/**
 * Галерея работ: ровная сетка кадров одного размера.
 *
 * В присланном макете «Галерея — варианты 1а» был крупный кадр слева и
 * четыре миниатюры справа. Заказчик попросил переделать: одна большая
 * фотография и остальные в четверть размера читались как «эти работы
 * хуже», хотя выбраны они не по качеству, а по порядку в списке.
 *
 * Три вещи из макета не перенесены осознанно:
 *
 * 1. Подпись «Съёмный шар · без выреза бампера · 3 часа» под именем
 *    машины. Какой фаркоп стоит на каждом снимке, мы не знаем — модель
 *    ТСУ на фотографиях не видна. Подписывать наугад на сайте, где по
 *    этим характеристикам выбирают деталь, нельзя.
 * 2. Ссылка «Ещё 3 795 работ». Снимков у нас девятнадцать; число берётся
 *    из данных, а не из макета.
 * 3. Тип кузова в базе снимков не хранится — проставлен здесь руками по
 *    маркам.
 *
 * Точка обрезки берётся из данных, своя на каждый снимок. Снимки
 * вертикальные, 960 на 1280, а рамки широкие: при пропорции 4 к 3 в кадр
 * попадает чуть больше половины высоты снимка. Фаркопы при этом стоят на разной высоте, от 0.61 до
 * 0.73, и одна общая точка неизбежно теряла половину из них.
 *
 * Считать под каждую рамку отдельно не нужно: object-position в процентах
 * совмещает точку снимка с той же точкой рамки. Достаточно указать, где на
 * фотографии фаркоп, — и он окажется в кадре при любой её пропорции.
 *
 */
export interface GalleryWork {
  car: string
  photo: string
  /** Страница фаркопов для этой машины. Нет у крупных планов узла. */
  href?: string
  /** Производитель фаркопа — только если виден на снимке. */
  article?: string
  /**
   * Зачем ставили фаркоп: «Для перевозки прицепа», «Под велокрепление».
   *
   * ЗАГЛУШКА. На снимках этого не написано, и мы этого не знаем —
   * значения проставлены по типу машины как образец разметки. Заказчик
   * помнит каждую работу и поправит их в админке; до этого показывать
   * их как факт нельзя.
   */
  use?: string
  /** Надпись на кнопке у крупного кадра. Разная, чтобы не звучать шаблоном. */
  cta?: string
  /** Тип кузова для фильтра. */
  body?: 'Кроссоверы' | 'Седаны' | 'Универсалы'
  /**
   * Где на снимке фаркоп — доля высоты кадра. Замерено по каждому фото:
   * разброс от 0.61 до 0.73, потому что машины разной высоты и сняты с
   * разной точки.
   */
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
  const [expanded, setExpanded] = useState(false)

  const shown = useMemo(
    () => (filter === 'Все' ? works : works.filter((work) => work.body === filter)),
    [filter, works],
  )

  /*
    Два ряда по пять. Больше сразу не показываем: двенадцать плиток
    растягивают секцию на полтора экрана и отодвигают всё, что под ней.
  */
  const PAGE = 10
  const visible = expanded ? shown : shown.slice(0, PAGE)
  const hidden = shown.length - visible.length


  /*
    Секция светлая, хотя соседние — тёмные.

    До перехода на классическую вёрстку секции были отдельными окнами с
    просветами, и три тёмные подряд (акции, «Один визит», работы) не
    мешали. Встык они слились в одно чёрное полотно на три экрана.

    Светлой сделана именно галерея: снимки тёмные сами по себе, на
    светлом поле они читаются как кадры в рамке, а не как продолжение
    фона. Тон #efedea, а не #f7f6f4 соседнего «О нас» — чтобы и две
    светлые секции подряд не слились.

    Подписи на самих снимках остались белыми явно: секция задаёт
    тёмный текст, а они лежат поверх фотографии.
  */
  return (
    <section className="overflow-hidden bg-paper-2 text-ink-dark">
      <div className="w-full px-5 py-12 sm:px-8 sm:py-14 lg:px-14 lg:py-[clamp(40px,5vh,64px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-dark/65">Работы</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
              Галерея работ
            </h2>
            <p className="mt-3 max-w-[52ch] text-[17px] leading-[1.55] text-[#5C5C5A]">
              Фотографии с нашего подъёмника. Найдите свою модель и посмотрите, как фаркоп
              выглядит вживую.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <b className="block font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] font-normal leading-none tracking-[-0.02em]">
              {total}
            </b>
            <span className="mt-2 block text-sm text-[#5C5C5A]">установок с 2014 года</span>
          </div>
        </div>
        {/*
          Выбранный фильтр залит фирменным красным, а не белым, как в
          макете: белым на этой странице отмечены призывы к действию —
          кнопка на крупном кадре и кнопка на первом экране. Фильтр
          действием не является, и путать их незачем.
        */}

        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Фильтр по типу кузова">
          {FILTERS.map((name) => {
            const active = filter === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setFilter(name)
                  setExpanded(false)
                }}
                aria-pressed={active}
                className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent text-accent-soft'
                    : 'border-ink-dark/20 text-[#5C5C5A] hover:border-ink-dark hover:text-ink-dark'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>

        {/*
          Ровная сетка мелкими плитками — по присланному макету
          «Галерея установок».

          Сначала здесь был крупный кадр слева и четыре миниатюры справа,
          как в первом макете. Заказчик попросил переделать дважды: сперва
          на равные плитки (одна большая фотография читалась как «эта
          работа лучше», хотя выбрана она по порядку в списке), потом —
          мельче, по пять в ряд.

          Первыми показываем два ряда, остальное — по кнопке. Двенадцать
          плиток сразу растягивали секцию на полтора экрана и отодвигали
          всё, что под ней.
        */}
        <div className="mt-5 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((work) => {
            const inner = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={work.photo}
                  alt={`Фаркоп на ${work.car}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  style={{ objectPosition: `50% ${(work.focus ?? 0.68) * 100}%` }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(0deg, rgba(11,11,12,.86) 0%, rgba(11,11,12,0) 58%)',
                  }}
                />

                {/*
                  «Фаркоп на» перед маркой — просьба заказчика. Плитка
                  без этого слова читалась просто списком машин, а речь
                  о фаркопах.
                */}
                <span className="absolute inset-x-4 bottom-3.5 z-[1] flex flex-col gap-[3px] text-left text-white">
                  {work.use ? (
                    <span className="text-[10px] font-medium uppercase leading-[1.2] tracking-[0.14em] text-white/80">
                      {work.use}
                    </span>
                  ) : null}
                  <span className="font-[family-name:var(--font-display)] text-[16px] leading-[1.15] tracking-[-0.02em]">
                    Фаркоп на {work.car}
                  </span>
                  {work.href && work.cta ? (
                    <span className="mt-0.5 flex items-center gap-2 text-[12px] font-medium text-accent-bright">
                      {work.cta} <span aria-hidden>→</span>
                    </span>
                  ) : null}
                </span>
              </>
            )

            const shell =
              'group relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface-2'

            return work.href ? (
              <Link key={work.photo} href={work.href} className={shell}>
                {inner}
              </Link>
            ) : (
              <div key={work.photo} className={shell}>
                {inner}
              </div>
            )
          })}
        </div>

        {hidden > 0 ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="cursor-pointer rounded-full border border-ink-dark/20 px-7 py-3 text-[15px] font-medium transition-colors hover:border-ink-dark"
            >
              Показать ещё {hidden}
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-5">
          <Link
            href={allHref}
            className="inline-flex items-center gap-3 rounded-full border border-ink-dark/20 px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink-dark"
          >
            Все работы <span className="opacity-60" aria-hidden>→</span>
          </Link>
          <span className="text-sm text-[#5C5C5A]">
            Не нашли свою модель — позвоните, проверим по каталогу
          </span>
        </div>
      </div>
    </section>
  )
}
