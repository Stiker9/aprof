'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Лента снимков со стрелками.
 *
 * Полоса прокрутки убрана, вместо неё две кнопки над лентой. Просто
 * спрятать полосу нельзя: с мышью тогда не остаётся никакого способа
 * листать вбок, кроме колеса с Shift, о котором мало кто знает.
 *
 * Лента по-прежнему уходит за правый край — это приём макета, он
 * сообщает, что снимков больше. Прилипание доводит кадр до края, чтобы
 * лента не замирала на половине снимка.
 *
 * Кнопки гаснут на краях: неработающая кнопка, которая выглядит
 * рабочей, раздражает сильнее, чем её отсутствие.
 */
export function PhotoStrip({
  children,
  className = '',
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  ariaLabel: string
}) {
  const track = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const sync = () => {
    const el = track.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }

  useEffect(() => {
    sync()
    const el = track.current
    if (!el) return
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  /** Шаг — ширина первого кадра с зазором: лист листается ровно на снимок. */
  const scrollBy = (direction: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: step * direction, behavior: 'smooth' })
  }

  const button = 'flex h-11 w-11 items-center justify-center rounded-full border transition-colors'

  return (
    <div className={className}>
      <div className="mx-auto flex w-full max-w-[1400px] justify-end gap-2 px-6">
        <button
          type="button"
          aria-label="Предыдущие снимки"
          onClick={() => scrollBy(-1)}
          disabled={atStart}
          className={`${button} border-line text-ink hover:border-ink-muted disabled:opacity-30`}
        >
          <span aria-hidden>←</span>
        </button>
        <button
          type="button"
          aria-label="Следующие снимки"
          onClick={() => scrollBy(1)}
          disabled={atEnd}
          className={`${button} border-line text-ink hover:border-ink-muted disabled:opacity-30`}
        >
          <span aria-hidden>→</span>
        </button>
      </div>

      {/*
        `scroll-pl` повторяет левый отступ: без него прилипание считает
        началом первый кадр, лента при загрузке подтягивается к нему и
        съедает отступ — снимки перестают совпадать по линии с
        заголовком.
      */}
      <div
        ref={track}
        role="group"
        aria-label={ariaLabel}
        className="strip mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pl-[max(1.5rem,calc((100%-1400px)/2+1.5rem))] pr-6 scroll-pl-[max(1.5rem,calc((100%-1400px)/2+1.5rem))]"
      >
        {children}
      </div>
    </div>
  )
}
