'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Раскладка-сетка с разворотом снимка. Взята с 21st.dev
 * (@manuarora700 / layout-grid) и переписана под наш случай.
 *
 * Исходник рассчитан на четыре карточки ростом в экран, у нас их
 * девятнадцать — отсюда почти все отличия:
 *
 * 1. Тип content — React.ReactNode вместо JSX.Element. В React 19 убрали
 *    глобальное пространство имён JSX, и исходный тип не собирается.
 * 2. У сетки задана высота ряда и плотная укладка. Исходник требует, чтобы
 *    высоту задал родитель, — это работает, только пока сетка ростом в
 *    экран.
 * 3. Обрезка снимка не по верху, а чуть ниже центра. Исходник рассчитан на
 *    горизонтальные кадры, у нас вертикальные 3:4 с телефона, и фаркоп на
 *    них в нижней трети: при object-top в кадр попадала одна крыша машины.
 * 4. Разворот вынесен в отдельный слой поверх экрана. В исходнике карточка
 *    получает position:absolute внутри сетки: при сетке ростом в экран это
 *    и есть центр экрана, а при сетке в 1355 пикселей — центр сетки, и до
 *    открытого снимка приходилось листать.
 * 5. Анимации появления нет вовсе, и framer-motion из зависимостей убран.
 *
 *    Любое появление из opacity: 0 — ставка на то, что браузер успеет его
 *    проиграть. Если не успеет, снимок останется невидимым: не «откроется
 *    резко», а не откроется совсем. Проверили дважды — и с библиотекой, и
 *    с ключевыми кадрами CSS: через две с половиной секунды карточка всё
 *    ещё имела opacity: 0.
 *
 *    Просмотрщику фотографий важнее открыться, чем открыться красиво.
 *    Вместе с библиотекой ушла и общая анимация перехода из сетки в
 *    разворот — она держалась на layoutId.
 *
 * next/image не подходит: снимки лежат в разметке абсолютом поверх
 * карточки, а next/image добавляет свою обёртку и ломает раскладку.
 */
type Card = {
  id: number
  content: React.ReactNode
  className: string
  thumbnail: string
}

export const LayoutGrid = ({ cards }: { cards: Card[] }) => {
  const [selected, setSelected] = useState<Card | null>(null)

  useEffect(() => {
    if (!selected) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)

    /*
      Прокрутку под открытым снимком стопорим: иначе колесо листает
      галерею за наложением, и, закрыв снимок, человек оказывается не там,
      где был.
    */
    const scrollBefore = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = scrollBefore
    }
  }, [selected])

  return (
    <>
      <div className="grid w-full grid-flow-row-dense auto-rows-[minmax(185px,1fr)] grid-cols-2 gap-2.5 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.id} className={card.className}>
            <button
              type="button"
              onClick={() => setSelected(card)}
              aria-label="Открыть снимок"
              className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-xl bg-neutral-900"
            >
              <Thumb card={card} />
            </button>
          </div>
        ))}
      </div>

      {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <div
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            <div className="relative z-10 flex h-[min(82vh,700px)] w-[min(94vw,1000px)] flex-col justify-end overflow-hidden rounded-xl bg-neutral-900">
              <Thumb card={selected} expanded />
              <SelectedCard selected={selected} />
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Закрыть"
              className="absolute right-4 top-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
            >
              <span aria-hidden>×</span>
            </button>
        </div>
      )}
    </>
  )
}

const Thumb = ({ card, expanded = false }: { card: Card; expanded?: boolean }) => {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={card.thumbnail}
      alt=""
      loading={expanded ? 'eager' : 'lazy'}
      className={cn(
        'absolute inset-0 h-full w-full',
        expanded
          ? 'object-contain'
          : 'object-cover object-[50%_62%] transition-transform duration-500 group-hover:scale-[1.05]',
      )}
    />
  )
}

const SelectedCard = ({ selected }: { selected: Card }) => {
  return (
    <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-6 pb-6 pt-16">
      {selected.content}
    </div>
  )
}
