'use client'

import { useEffect, useState } from 'react'

/**
 * Снимок товара.
 *
 * Раньше сюда приходил весь product.images — снимки со стенда
 * поставщика вперемешку со схемами, и на каждом было замощено чужое
 * «ФАРКОП.РФ» с чужим телефоном. Публиковать это — рекламировать
 * конкурента, поэтому теперь сюда попадает не массив поставщика, а один
 * заранее выбранный кадр (см. product-image.ts): настоящая схема этого
 * артикула у проверенных заводов или обобщённый рисунок по типу шара.
 *
 * Тем самым и миниатюры, и стрелки перестали быть нужны — кадр один, и
 * листать нечего. Остался только зум: клик открывает кадр во весь
 * экран, там Esc и клик снаружи закрывают.
 *
 * Обычный <img>, а не next/image: часть кадров — внешние адреса схем на
 * сайте поставщика, и заводить чужой домен в оптимизатор незачем.
 */
export function ProductGallery({
  src,
  article,
  caption,
}: {
  src: string
  article: string
  caption?: string
}) {
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!zoomed) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false)
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
  }, [zoomed])

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Открыть снимок во весь экран"
          className="group relative h-[440px] cursor-zoom-in overflow-hidden rounded-[14px] bg-[#141416]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Фаркоп ${article}`} className="h-full w-full object-contain" />

          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            Увеличить
          </span>
        </button>

        {caption ? <p className="px-1 text-[13px] leading-[1.4] text-ink-muted">{caption}</p> : null}
      </div>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Фаркоп ${article}`}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 sm:p-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
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
        </div>
      )}
    </>
  )
}
