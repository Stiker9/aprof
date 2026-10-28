'use client'

import { useEffect, useRef, useState } from 'react'
import type { PhotoGroup } from '@/catalog/own-photos'

/**
 * Снимки товара.
 *
 * ── Два режима ──
 *
 * Своих фото у владельца нет — показывается один кадр, как раньше:
 * схема артикула от завода или обобщённый рисунок по типу шара (см.
 * product-image.ts). Листать нечего, остаётся только зум.
 *
 * Свои фото есть — галерея как у магазинов-конкурентов: большой кадр,
 * под ним миниатюры, клик — во весь экран со стрелками и свайпом.
 *
 * ── Группы ──
 *
 * Фото разложены по машинам: «Фаркоп» (общие — сам фаркоп) и «на Audi
 * Q7», «на Touareg». Один артикул подходит к нескольким машинам, и
 * покупатель должен видеть фаркоп на своей, а не на чужой.
 *
 * Чья машина — подсказывает адрес: карточка на странице Q7 ведёт сюда с
 * ?car=audi/q7, и первой открывается группа Q7. Адрес читается в
 * браузере, а не на сервере: страница статическая, одна на все машины.
 *
 * Обычный <img>, а не next/image: в статической выгрузке оптимизатора
 * нет, а файлы владельца и так ужаты до 1600 пикселей при загрузке.
 */
export function ProductGallery({
  src,
  article,
  caption,
  groups = [],
}: {
  /** Кадр по умолчанию — когда своих фото нет. */
  src: string
  article: string
  caption?: string
  groups?: PhotoGroup[]
}) {
  /*
    Пришёл покупатель со своей машины (?car=) — показываем только её фото
    и общие, чужие машины не показываем вовсе. Раньше рядом висела
    вкладка «на Audi Q8», и покупатель Cayenne видел чужую машину —
    Егор назвал это «перепрыгиванием»: машины одной платформы снаружи
    сильно разные, и фото с другой только сбивает с толку.

    Без ?car (пришли из поиска) — все группы вкладками, у каждой подпись,
    на какой она машине.

    До того как скрипт прочитал адрес, видны только общие фото. Страница
    статическая, и начни она со всех групп — покупатель Cayenne на
    медленном телефоне секунду-другую смотрел бы на Audi, пока не
    сработает фильтр. То же перепрыгивание, только короче.
  */
  const general = groups.filter((group) => group.key === '')
  const [shown, setShown] = useState(general)
  const [groupKey, setGroupKey] = useState('')
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const car = new URLSearchParams(window.location.search).get('car')
    if (!car) {
      setShown(groups)
      setGroupKey(groups[0]?.key ?? '')
      return
    }
    const own = groups.filter((group) => group.key === '' || group.key === car)
    setShown(own)
    setGroupKey(own.some((group) => group.key === car) ? car : '')
    setIndex(0)
    // Только при открытии: дальше группу выбирает сам человек.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const group = shown.find((g) => g.key === groupKey) ?? shown[0]
  const photos = group ? group.photos : [src]
  const current = photos[Math.min(index, photos.length - 1)]
  const alt = group?.label ? `Фаркоп ${article} на ${group.label}` : `Фаркоп ${article}`

  const step = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length)

  useEffect(() => {
    if (!zoomed) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false)
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)

    /*
      Прокрутку страницы под открытым снимком стопорим. Без этого колесо
      мыши листает каталог за наложением, и, закрыв снимок, человек
      оказывается не там, где был.
    */
    const scrollBefore = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = scrollBefore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomed, photos.length])

  // Свайп на телефоне: короткое движение пальцем — следующий кадр.
  const touchX = useRef<number | null>(null)
  const swipe = {
    onTouchStart: (event: React.TouchEvent) => {
      touchX.current = event.touches[0].clientX
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (touchX.current === null) return
      const dx = event.changedTouches[0].clientX - touchX.current
      touchX.current = null
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1)
    },
  }

  const many = photos.length > 1

  return (
    <>
      <div className="flex flex-col gap-3">
        {shown.length > 1 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Фото по машинам">
            {shown.map((g) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={g.key === group?.key}
                onClick={() => {
                  setGroupKey(g.key)
                  setIndex(0)
                }}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                  g.key === group?.key
                    ? 'border-ink-dark bg-ink-dark text-white'
                    : 'border-line-light bg-white text-[#444442] hover:border-ink-dark/40'
                }`}
              >
                {g.label ? `на ${g.label}` : 'Фаркоп'}
                <span className="ml-1.5 opacity-60">{g.photos.length}</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Открыть снимок во весь экран"
          className="group relative h-[440px] cursor-zoom-in overflow-hidden rounded-[14px] bg-[#141416]"
          {...swipe}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={alt} className="h-full w-full object-contain" />

          {many && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              {index + 1} / {photos.length}
            </span>
          )}
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            Увеличить
          </span>
        </button>

        {many && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, i) => (
              <button
                key={photo}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Снимок ${i + 1}`}
                aria-current={i === index}
                className={`h-[64px] w-[84px] shrink-0 overflow-hidden rounded-lg border-2 bg-[#141416] transition-colors ${
                  i === index ? 'border-accent' : 'border-transparent hover:border-ink-dark/30'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {group ? (
          <p className="px-1 text-[13px] leading-[1.4] text-[#444442]">
            {group.label
              ? `Фаркоп ${article} на ${group.label} — снимки нашей установки.`
              : `Фаркоп ${article} — наши снимки.`}
          </p>
        ) : caption ? (
          <p className="px-1 text-[13px] leading-[1.4] text-[#444442]">{caption}</p>
        ) : null}
      </div>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 sm:p-10"
          {...swipe}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full cursor-default object-contain"
          />

          {many && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                aria-label="Предыдущий снимок"
                className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
              >
                <span aria-hidden>‹</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                aria-label="Следующий снимок"
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
              >
                <span aria-hidden>›</span>
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {index + 1} / {photos.length}
              </span>
            </>
          )}

          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      )}
    </>
  )
}
