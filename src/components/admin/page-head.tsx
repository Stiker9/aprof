import type { ReactNode } from 'react'

/**
 * Заголовок раздела.
 *
 * Подпись под заголовком обязательна и не декоративна: разделы админки
 * называются существительными («Товары», «Публикации»), а владелец
 * приходит с вопросом «где поменять цену». Подпись отвечает на него
 * словами из его задачи.
 *
 * Шапка липкая: в таблицах прокручивают далеко, и без неё посреди
 * пяти тысяч строк не видно, в каком ты разделе и что за фильтр
 * включён.
 */
export function PageHead({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  /** Правая часть строки: поиск, фильтры, кнопки. */
  children?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line-light bg-paper/95 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ink-dark">
            {title}
          </h1>
          {lead && <p className="mt-0.5 text-[13px] text-ink-muted">{lead}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}

/** Тело раздела — общий отступ, чтобы он не задавался в каждом экране по-своему. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="px-6 py-5">{children}</div>
}

/**
 * Плашка «здесь пока ничего нет».
 *
 * Пустой раздел обязан объяснять, почему он пуст и что сделать. Иначе
 * владелец решит, что админка сломана, — так и было с пустыми отзывами
 * на самом сайте.
 */
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line-light bg-white px-6 py-10 text-center">
      <p className="font-semibold text-ink-dark">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-muted">{children}</p>}
    </div>
  )
}
