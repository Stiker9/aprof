'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './hero-background.module.css'

const slides = [
  { src: '/images/redesign/hero-bikes-forest.webp', label: 'Автомобиль с велосипедами в лесу', position: '70% 50%' },
  { src: '/images/hero-prado-4k.webp', label: 'Prado на набережной', position: '55% 45%' },
  { src: '/images/redesign/hero-boat-lake.webp', label: 'Автомобиль с лодкой у озера', position: '65% 50%' },
  { src: '/images/redesign/hero-camper-lake.webp', label: 'Внедорожник с домом на колёсах у озера', position: '70% 50%' },
]

/*
  Тайминги сверены с сайтами, где первый экран тоже меняет кадры
  (Yakima, Lexus, Belmond, Westfalia, Genesis): кадр стоит 4–5 секунд,
  переход 0,3–1 секунда. У нас кадр стоит 9 секунд — заказчик попросил
  не торопить: поверх фото заголовок и подпись, и кадр должен успеть
  «пожить».

  Затухание 1,4 секунды с мягким разгоном и торможением. Было 2,4 с
  ровным ходом — два кадра подолгу просвечивали друг сквозь друга, и
  картинка выглядела мутной; было и 1 с — заказчику показалось резко.

  Оба числа уходят в CSS переменными — правится только здесь.
*/
const SLIDE_MS = 9000
const FADE_MS = 1400

export function HeroBackground({ onSlideChange }: { onSlideChange?: (index: number) => void }) {
  const [active, setActive] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [ready, setReady] = useState<Record<string, boolean>>({})
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(true)
  /*
    Первый экран прокручен — кадры не меняются. Смена кадра в невидимой
    секции только жжёт батарею телефона и тянет из сети следующие фото,
    которых никто не увидит.
  */
  const [inView, setInView] = useState(true)
  const stage = useRef<HTMLDivElement>(null)
  /*
    Сначала грузится только первый кадр — он и есть первый экран.
    Остальные три подтягиваются, когда первый уже показан и браузер
    освободился: иначе все четыре фото делят канал на старте, и первый
    экран на мобильном интернете появляется в разы позже.
  */
  const [loadRest, setLoadRest] = useState(false)
  const firstReady = Boolean(ready[slides[0].src])
  const nextReady = Boolean(ready[slides[(active + 1) % slides.length].src])
  const running = !paused && visible && inView && nextReady

  const markReady = (src: string) => {
    setReady(current => current[src] ? current : { ...current, [src]: true })
  }

  useEffect(() => {
    if (!firstReady || loadRest) return
    const start = () => setLoadRest(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(start, 500)
    return () => window.clearTimeout(timer)
  }, [firstReady, loadRest])

  useEffect(() => {
    onSlideChange?.(active)
  }, [active, onSlideChange])

  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    const node = stage.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const selectSlide = (index: number) => {
    if (index === active || previous !== null) return
    setPrevious(active)
    setActive(index)
  }
  useEffect(() => {
    if (previous === null) return
    const timer = window.setTimeout(() => setPrevious(null), FADE_MS)
    return () => window.clearTimeout(timer)
  }, [previous])

  /*
    Автопрокрутка на таймере, а не на CSS-анимации полосы прогресса:
    полосу убрали, она дублировала точки и тянула взгляд через весь
    экран. Заодно таймер честно встаёт на паузу — и когда человек нажал
    «пауза», и когда вкладка скрыта или первый экран прокручен.
  */
  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => selectSlide((active + 1) % slides.length), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [running, active, previous])

  return (
    <>
      <div ref={stage} className="absolute inset-0 isolate"
        style={{ '--fade': `${FADE_MS}ms`, '--drift': `${SLIDE_MS + FADE_MS}ms` } as CSSProperties}>
      {slides.map((slide, index) => (
        <div key={slide.src} className={styles.slide} data-active={active === index || previous === index}
          style={{ opacity: active === index || previous === index ? 1 : 0, zIndex: active === index ? 2 : previous === index ? 1 : 0 }}>
        {(index === 0 || loadRest) && <Image src={slide.src} alt="" fill sizes="100vw"
          priority={index === 0} loading={index === 0 ? undefined : 'eager'}
          onLoad={() => markReady(slide.src)}
          ref={image => {
            if (image?.complete && image.naturalWidth > 0) markReady(slide.src)
          }}
          className={`${styles.photo} ${index === 1 ? styles.prado : ''}`}
          style={index === 1 ? undefined : { objectPosition: slide.position, transformOrigin: slide.position }}
        />}
        </div>
      ))}
      </div>
      <div aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity"
        style={{
          transitionDuration: `${FADE_MS}ms`,
          opacity: active === 2 || active === 3 ? 1 : 0,
          background: 'linear-gradient(90deg, rgba(8,8,9,.45) 0%, rgba(8,8,9,.3) 35%, transparent 65%)',
        }} />
      {/*
        Переключатель кадров — минимальный: ни подложки, ни рамки, ни
        блюра. Только четыре точки на фотографии: текущая вытянута в
        красный штрих, остальные — тихие белые. Сперва здесь была тёмная
        «пилюля» с рамкой, и на светлом кадре она читалась как отдельная
        кнопка поверх снимка, хотя это всего лишь навигация.

        Площадь нажатия при этом остаётся 40×32 — палец не промахивается,
        хотя видно только точку: сама кнопка прозрачная.
      */}
      <div className="absolute bottom-6 right-5 z-10 flex items-center text-white sm:right-8"
        role="group" aria-label="Фотографии первого экрана">
        {slides.map((slide, index) => (
          <button key={slide.src} type="button" disabled={!ready[slide.src] || previous !== null}
            aria-label={`Показать: ${slide.label}`} aria-pressed={active === index}
            onClick={() => selectSlide(index)}
            className="flex h-10 w-8 items-center justify-center focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40">
            <span
              className={`block rounded-full shadow-[0_1px_3px_rgba(0,0,0,.55)] transition-all duration-500 motion-reduce:transition-none ${
                active === index ? 'h-1.5 w-6 bg-accent' : 'h-1.5 w-1.5 bg-white/75 hover:bg-white'
              }`}
            />
          </button>
        ))}
        <button type="button" onClick={() => setPaused(value => !value)}
          aria-label={paused ? 'Включить смену фотографий' : 'Приостановить смену фотографий'}
          className="ml-2 flex h-10 w-6 items-center justify-center text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,.7)] transition-colors hover:text-white focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
            <path d={paused ? 'M8 5L20 12L8 19Z' : 'M6 5H10V19H6ZM14 5H18V19H14Z'} />
          </svg>
        </button>
      </div>
    </>
  )
}
