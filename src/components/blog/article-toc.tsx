'use client'

import { useEffect, useState } from 'react'

interface Item {
  id: string
  text: string
}

/**
 * Оглавление статьи.
 *
 * Берёт заголовки второго уровня прямо из вёрстки статьи, поэтому новая
 * статья не требует отдельного списка: достаточно дать каждому `<h2>`
 * свой `id`. Именно `id` в самой разметке, а не добавленный скриптом:
 * якорь должен быть в HTML сразу, иначе поисковик не покажет ссылки на
 * разделы под результатом. Заголовок без `id` в оглавление не попадает.
 *
 * Текущий раздел подсвечивается по мере прокрутки.
 */
export function ArticleToc() {
  const [items, setItems] = useState<Item[]>([])
  const [active, setActive] = useState('')

  useEffect(() => {
    const headings = [...document.querySelectorAll<HTMLHeadingElement>('.article h2[id]')]
    setItems(headings.map((h) => ({ id: h.id, text: h.textContent ?? '' })))
    if (headings.length === 0) return

    /*
      Положение считается по getBoundingClientRect, а не через
      IntersectionObserver: у страницы общий `zoom` (см. --zoom), и
      наблюдатель при нём путает координаты — раздел не подсвечивался.
    */
    const update = () => {
      let current = ''
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 140) current = h.id
      }
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (items.length === 0) return null

  return (
    <nav aria-label="Содержание статьи">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] opacity-75">Содержание</p>
      <ol className="mt-4 border-l border-line-light">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
              className={`-ml-px block border-l-2 py-2 pl-4 text-[14px] leading-[1.4] transition-colors ${
                active === item.id
                  ? 'border-accent font-medium text-ink-dark'
                  : 'border-transparent text-ink-dark/80 hover:text-ink-dark'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
