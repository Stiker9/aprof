'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

/**
 * Галерея работ: крупный кадр слева, миниатюры справа.
 *
 * Раскладка из присланного макета «Галерея — варианты 1а», перенесённая на
 * наши токены: цвета, скругления и шрифты берутся из дизайн-системы, а не
 * из чужого файла.
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
 * вертикальные, 960 на 1280, а рамки широкие: у миниатюры пропорция
 * 6.8 к 1, и в неё попадает полоса всего в 141 пиксель из 1280 — одиннадцать
 * процентов снимка. Фаркопы при этом стоят на разной высоте, от 0.61 до
 * 0.73, и одна общая точка неизбежно теряла половину из них.
 *
 * Считать под каждую рамку отдельно не нужно: object-position в процентах
 * совмещает точку снимка с той же точкой рамки. Достаточно указать, где на
 * фотографии фаркоп, — и он окажется в кадре при любой её пропорции.
 *
 * Высота ужата против макета: там крупный кадр 560 пикселей, и вместе с
 * заголовком, фильтрами и подвалом секция занимала весь экран целиком —
 * следующий блок не показывался вовсе, и страница читалась как обрубок.
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
  const [current, setCurrent] = useState(0)

  const shown = useMemo(
    () => (filter === 'Все' ? works : works.filter((work) => work.body === filter)),
    [filter, works],
  )

  /*
    Показываем четыре миниатюры: столько влезает в колонку рядом с крупным
    кадром, не сплющиваясь. Остальные живут на странице работ.
  */
  const thumbs = shown.slice(0, 4)
  const rest = shown.length - thumbs.length
  const hero = shown[Math.min(current, shown.length - 1)] ?? works[0]

  const pick = (next: (typeof FILTERS)[number]) => {
    setFilter(next)
    setCurrent(0)
  }

  return (
    <section className="overflow-hidden bg-surface text-ink">
      <div className="w-full px-5 py-12 sm:px-8 sm:py-14 lg:px-14 lg:py-[clamp(40px,5vh,64px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-dim">Работы</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
              Галерея работ
            </h2>
            <p className="mt-3 max-w-[52ch] text-[17px] leading-[1.55] text-ink-muted">
              Фотографии с нашего подъёмника. Найдите свою модель и посмотрите, как фаркоп
              выглядит вживую.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <b className="block font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] font-normal leading-none tracking-[-0.02em]">
              {total}
            </b>
            <span className="mt-2 block text-sm text-ink-muted">установок с 2014 года</span>
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
                onClick={() => pick(name)}
                aria-pressed={active}
                className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent text-accent-soft'
                    : 'border-white/20 text-ink-muted hover:border-white hover:text-ink'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.9fr_minmax(0,1fr)] lg:items-stretch">
          <figure className="relative m-0 min-h-[320px] overflow-hidden rounded-[var(--radius-card)] bg-surface-2 lg:min-h-[400px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.photo}
              alt={`Фаркоп на ${hero.car}`}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: `50% ${(hero.focus ?? 0.68) * 100}%` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(0deg, rgba(11,11,12,.88) 0%, rgba(11,11,12,0) 52%)',
              }}
            />

            {/*
              Подпись в два яруса: сверху зачем ставили, снизу на какую
              машину. Так просил заказчик — по образцу, где строка целиком
              звучит «Для перевозки прицепа на Renault Duster». Разбито на
              две строки, потому что машина здесь ещё и заголовок кадра:
              одной строкой она потеряла бы вес.
            */}
            <figcaption className="absolute inset-x-6 bottom-7 z-[1] flex flex-wrap items-end justify-between gap-6 sm:inset-x-9">
              <div>
                {/*
                  Подпись белая, а не красная. Красным она сперва и была —
                  фирменный цвет, — но на светлых кузовах пропадала: серый
                  под ней и красный поверх дают слишком слабый контраст, а
                  мелкий кегль с широкой разрядкой добивал остаток.

                  Красное на кадре теперь одно — кнопка. Два красных пятна
                  на одном снимке спорили бы между собой.
                */}
                {hero.use ? (
                  <div className="mb-1.5 text-[13px] font-medium uppercase tracking-[0.14em] text-white/85">
                    {hero.use}
                  </div>
                ) : null}
                <div className="font-[family-name:var(--font-display)] text-[clamp(22px,2.2vw,30px)] leading-[1.1] tracking-[-0.02em]">
                  {hero.car}
                </div>
                {hero.article ? (
                  <div className="mt-2 text-[15px] text-ink-muted">Фаркоп {hero.article}</div>
                ) : null}
              </div>

              {hero.href ? (
                <Link
                  href={hero.href}
                  className="whitespace-nowrap rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-soft transition-[filter] hover:brightness-110"
                >
                  {hero.cta ?? `Фаркопы на ${hero.car}`}
                </Link>
              ) : null}
            </figcaption>
          </figure>

          {/*
            На узком экране миниатюры превращаются в горизонтальную ленту:
            столбцом они там растянулись бы на два экрана.
          */}
          <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {thumbs.map((work, index) => {
              const active = work === hero
              return (
                <button
                  key={work.photo}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-current={active}
                  className={`relative min-h-[140px] w-[190px] shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-card)] bg-surface-2 outline-2 -outline-offset-2 transition-[outline-color] lg:min-h-[104px] lg:w-auto lg:flex-1 ${
                    active ? 'outline-accent' : 'outline-transparent hover:outline-white/50'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={work.photo}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: `50% ${(work.focus ?? 0.68) * 100}%` }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(0deg, rgba(11,11,12,.82) 0%, rgba(11,11,12,.05) 65%)',
                    }}
                  />
                  {/*
                    Назначение над названием машины — тем же порядком, что
                    и на крупном кадре. Кегль мелкий: миниатюра высотой
                    88 пикселей, и две строки в полный размер её забьют.
                  */}
                  <span className="absolute inset-x-4 bottom-3 z-[1] flex flex-col gap-0.5 text-left">
                    {work.use ? (
                      <span className="text-[10px] font-medium uppercase leading-[1.2] tracking-[0.12em] text-white/80">
                        {work.use}
                      </span>
                    ) : null}
                    <span className="text-sm font-medium leading-[1.2]">{work.car}</span>
                  </span>
                </button>
              )
            })}

            {rest > 0 ? (
              <Link
                href={allHref}
                className="flex min-h-[64px] w-[180px] shrink-0 items-center justify-center gap-2.5 rounded-[var(--radius-card)] border border-white/16 text-sm text-ink-muted transition-colors hover:border-white hover:text-ink lg:w-auto"
              >
                Ещё {rest} {rest === 1 ? 'работа' : rest < 5 ? 'работы' : 'работ'}{' '}
                <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          <Link
            href={allHref}
            className="inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-[15px] font-medium transition-colors hover:border-white"
          >
            Все работы <span className="opacity-60" aria-hidden>→</span>
          </Link>
          <span className="text-sm text-ink-dim">
            Не нашли свою модель — позвоните, проверим по каталогу
          </span>
        </div>
      </div>
    </section>
  )
}
