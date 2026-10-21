'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Плавная прокрутка колесом — как на augen.pro.
 *
 * Там стоит Lenis с двумя настройками: длительность 0,8 с и торможение
 * easeOutQuart (быстрый старт, мягкая остановка). Здесь то же самое.
 *
 * Чего плавная прокрутка НЕ трогает:
 * - телефоны и тачпады с касанием — там остаётся родная прокрутка
 *   системы, она и так плавная, а подменённая ощущается «ватной»;
 * - людей с настройкой «уменьшить движение» — для них Lenis не
 *   включается вовсе;
 * - вложенные списки с собственной прокруткой (выпадающий список марок,
 *   мобильное меню) — колесо над ними крутит их, а не страницу.
 *
 * Якоря (#faq, оглавление статьи) Lenis прокручивает сам и учитывает
 * `scroll-margin` у цели, поэтому заголовок не уезжает под шапку.
 */
let instance: Lenis | null = null

/** Наверх — плавно, если Lenis включён, иначе родной прокруткой. */
export function scrollToTop() {
  if (instance) instance.scrollTo(0)
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function SmoothScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      autoRaf: true,
    })
    instance = lenis

    return () => {
      lenis.destroy()
      instance = null
    }
  }, [])

  /*
    После перехода на другую страницу высота документа другая: без
    пересчёта Lenis упирался бы в низ прежней страницы.
  */
  useEffect(() => {
    instance?.resize()
  }, [pathname])

  return null
}
