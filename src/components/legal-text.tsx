import type { ReactNode } from 'react'

/**
 * Оформление правового документа.
 *
 * Узкая колонка и нумерованные разделы: такие тексты не читают подряд,
 * в них ищут нужный пункт и ссылаются на его номер.
 */
export function LegalBody({ children }: { children: ReactNode }) {
  return <div className="mt-12 max-w-[80ch]">{children}</div>
}

export function LegalSection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-[17px] font-medium">
        <span className="mr-3 opacity-40">{number}.</span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed opacity-75">{children}</div>
    </section>
  )
}
