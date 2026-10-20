'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Открывашка бокового меню на узком экране.
 *
 * ── Почему выдвижная панель, а не меню сверху ──
 *
 * Разделов двенадцать, сгруппированы по частоте. Строка со вкладками
 * сверху либо уместит четыре из них, либо поедет горизонтальной
 * прокруткой, в которой не видно, где ты находишься. Выдвижная панель
 * показывает всю структуру целиком — ту же, что на широком экране, и
 * искать по-разному в зависимости от устройства не приходится.
 *
 * ── Почему меню закрывается при переходе ──
 *
 * Это одна страница: ссылка не перезагружает документ, и панель
 * осталась бы раскрытой поверх раздела, в который только что перешли.
 * Поэтому следим за адресом и закрываемся при его смене.
 *
 * ── Состояние здесь, а не в макете ──
 *
 * Макет серверный и ничего про нажатия не знает. Этот компонент
 * оборачивает готовую разметку меню, пришедшую с сервера: в браузер
 * уезжает переключатель, а не сами разделы.
 */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Пока панель раскрыта, страница под ней прокручиваться не должна:
  // иначе палец листает список товаров вместо меню.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* Верхняя полоса — только на узком экране. */}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          aria-expanded={open}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block h-[2px] w-4 bg-current" />
            <span className="block h-[2px] w-4 bg-current" />
            <span className="block h-[2px] w-4 bg-current" />
          </span>
        </button>

        <span className="font-[family-name:var(--font-display)] text-[13px] font-bold tracking-tight text-ink">
          VASHFARKOP
        </span>
      </div>

      {/* Затемнение под панелью: нажатие мимо меню закрывает его. */}
      {open && (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface text-ink transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </div>
    </>
  )
}
