'use client'

import { useEffect, useState } from 'react'

/** Порог из макета: 24 пикселя прокрутки. */
export const SCROLL_THRESHOLD = 24

/**
 * Прокручена ли страница ниже порога.
 *
 * Один источник на шапку и на строку подбора. Раньше признак жил внутри
 * шапки, и подбор о нём не знал: при прокрутке шапка садилась с 72 до
 * 56, а строка под ней оставалась прежней высоты — между ними
 * открывалась полоса в шестнадцать пикселей.
 *
 * Слушатель пассивный: обработчик ничего не отменяет, и браузеру не
 * нужно ждать его, чтобы начать прокрутку.
 */
export function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return scrolled
}
