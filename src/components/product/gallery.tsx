'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

/**
 * Снимки товара.
 *
 * До этого миниатюры под главным кадром были мёртвыми: рисовались, но
 * не нажимались, и человек видел пять картинок, из которых доступна
 * ровно одна. Заказчик описал это точнее всех: «их вроде бы видно, но с
 * ними ничего не сделать».
 *
 * Клик по миниатюре меняет главный кадр, клик по главному открывает его
 * во весь экран — там стрелки, клавиши и Esc.
 *
 * Снимки лежат на сайте поставщика и приходят внешними адресами, поэтому
 * тут обычный <img>, а не next/image: оптимизатор потребовал бы вносить
 * чужой домен в настройки, а гонять через него чужие файлы незачем.
 * Среди снимков попадаются схемы, а не только фотографии — поэтому
 * object-contain и тёмная подложка, чтобы одинаково выглядели оба.
 */
export function ProductGallery({ images, article }: { images: string[]; article: string }) {
  const [current, setCurrent] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const count = images.length

  const go = useCallback(
    (delta: number) => {
      setCurrent((index) => (index + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (!zoomed) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false)
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
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
  }, [zoomed, go])

  /* Снимков нет вовсе — заглушка, и открывать в ней нечего. */
  if (count === 0) {
    return (
      <div className="relative h-[440px] overflow-hidden rounded-[14px] bg-[#141416]">
        <Image
          src="/images/product-sample.webp"
          alt={`Фаркоп ${article}`}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Открыть снимок во весь экран"
          className="group relative h-[440px] cursor-zoom-in overflow-hidden rounded-[14px] bg-[#141416]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[current]}
            alt={`Фаркоп ${article}`}
            className="h-full w-full object-contain"
          />

          {/*
            Подсказка о том, что кадр открывается. Проявляется на наведении:
            постоянная плашка поверх снимка мешала бы его рассматривать, а
            без всякого намёка человек снова не поймёт, что тут можно нажать.
          */}
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            Увеличить
          </span>
        </button>

        {count > 1 && (
          <div className="grid grid-cols-5 gap-2.5">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Снимок ${index + 1} из ${count}`}
                aria-current={index === current}
                className={`h-[92px] cursor-pointer overflow-hidden rounded-[9px] border-2 bg-[#141416] transition-colors ${
                  index === current
                    ? 'border-accent'
                    : 'border-transparent hover:border-white/25'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Фаркоп ${article}, снимок ${current + 1} из ${count}`}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 sm:p-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[current]}
            alt={`Фаркоп ${article}`}
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full cursor-default object-contain"
          />

          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
          >
            <span aria-hidden>×</span>
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  go(-1)
                }}
                aria-label="Предыдущий снимок"
                className="absolute left-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
              >
                <span aria-hidden>←</span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  go(1)
                }}
                aria-label="Следующий снимок"
                className="absolute right-4 bottom-1/2 flex h-11 w-11 translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
              >
                <span aria-hidden>→</span>
              </button>

              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white">
                {current + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </>
  )
}
