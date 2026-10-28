'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void
  }
}

/**
 * Просмотр страницы в Метрику при переходе внутри сайта.
 *
 * Next меняет страницы без перезагрузки, и счётчик, поставленный один
 * раз, увидел бы только первую страницу визита: человек прошёл
 * главная → марка → товар, а в статистике одна главная. Поэтому на
 * каждую смену адреса отправляем hit сами.
 *
 * Первый адрес пропускаем: его уже засчитал init при загрузке, второй
 * hit задвоил бы просмотр.
 */
export function MetrikaRouteHits({ id }: { id: number }) {
  const pathname = usePathname()
  const search = useSearchParams()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const query = search.toString()
    window.ym?.(id, 'hit', `${window.location.origin}${pathname}${query ? `?${query}` : ''}`, {
      referer: document.referrer,
      title: document.title,
    })
  }, [id, pathname, search])

  return null
}
