'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Карта, которая не крадёт прокрутку.
 *
 * Виджет Яндекс.Карт стоит в iframe и сам ловит колесо мыши: человек
 * листает страницу вниз, курсор попадает на карту — и вместо прокрутки
 * карта начинает уменьшаться. Поэтому пока карту не нажали, iframe
 * «спит»: накладка перехватывает мышь, и колесо листает страницу.
 *
 * Нажал — карта оживает: можно двигать и масштабировать. Увёл курсор,
 * нажал мимо или Escape — снова засыпает. На телефоне то же самое, только
 * вместо курсора — касание: один палец листает страницу, а касание
 * по карте включает её.
 *
 * Для чтения с экрана накладка — обычная кнопка с понятной подписью.
 */
export function MapEmbed({
  src,
  title,
  className = 'h-[380px]',
}: {
  src: string
  title: string
  className?: string
}) {
  const [active, setActive] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const outside = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setActive(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [active])

  return (
    <div
      ref={box}
      onMouseLeave={() => setActive(false)}
      className={`group relative overflow-hidden rounded-[var(--radius-block)] border border-line-light bg-paper-2 ${className}`}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        className={`h-full w-full border-0 ${active ? '' : 'pointer-events-none'}`}
      />

      {!active && (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label="Включить карту: двигать и масштабировать"
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink-dark/0 transition-colors duration-300 hover:bg-ink-dark/10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
        >
          <span className="rounded-full bg-white/90 px-5 py-2.5 text-[14px] font-medium text-ink-dark shadow-[0_8px_28px_rgba(0,0,0,0.18)] backdrop-blur transition-transform duration-300 group-hover:scale-[1.04]">
            Нажмите, чтобы двигать карту
          </span>
        </button>
      )}
    </div>
  )
}
