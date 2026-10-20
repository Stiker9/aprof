import type { ReactNode } from 'react'

/**
 * Строка «название поля — поле ввода — пояснение».
 *
 * Пояснение стоит под полем, а не всплывающей подсказкой: всплывающую
 * не видно, пока не наведёшь, а здесь оно отвечает на вопрос, который
 * возникает до заполнения, — «что сюда писать».
 */
export function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid gap-x-5 gap-y-1 border-t border-line-light py-3 first:border-t-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <span className="pt-2 text-[13px] font-semibold text-ink-dark">{label}</span>
      <div className="max-w-xl">
        {children}
        {hint && <p className="mt-1 text-[12px] text-ink-dim">{hint}</p>}
      </div>
    </div>
  )
}

/** Блок полей с заголовком. */
export function FieldGroup({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: ReactNode
}) {
  return (
    <section className="mb-5 rounded-card border border-line-light bg-white px-5 py-4">
      <h2 className="font-[family-name:var(--font-display)] text-[15px] font-bold">{title}</h2>
      {lead && <p className="mt-0.5 mb-2 text-[13px] text-ink-muted">{lead}</p>}
      <div className={lead ? '' : 'mt-2'}>{children}</div>
    </section>
  )
}
