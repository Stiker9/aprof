import type { ReactNode } from 'react'

/**
 * Тёмных тонов два, и разница между ними едва заметна — это и есть
 * замысел: две тёмные секции подряд не сливаются в одно полотно, но и
 * не спорят друг с другом. Светлый тон один.
 */
type Tone = 'dark' | 'dark-2' | 'light'

const TONES: Record<Tone, string> = {
  dark: 'bg-bg text-ink',
  'dark-2': 'bg-surface text-ink',
  light: 'bg-paper-3 text-ink-dark',
}

/**
 * Обёртка секции главной.
 *
 * Секции чередуют тёмный и светлый фон — это ритм страницы, заданный
 * макетом. Отступы и предельная ширина одинаковы у всех, поэтому
 * держатся в одном месте.
 */
export function Section({
  tone = 'dark',
  children,
  className = '',
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-[var(--radius-block)] ${TONES[tone]} ${className}`}
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 py-20 md:py-28">{children}</div>
    </section>
  )
}

/** Надзаголовок: мелкий, заглавными, с широкой разрядкой. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.2em] opacity-55">{children}</p>
}

/** Заголовок секции — Unbounded, отрицательный трекинг. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(26px,4vw,34px)] leading-tight tracking-[-0.03em]">
      {children}
    </h2>
  )
}

/** Одно предложение под заголовком. Больше на главной не пишем. */
export function SectionLead({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[54ch] text-[17px] opacity-70">{children}</p>
}

/**
 * Крупное число с подписью.
 *
 * По правилам оформления главной числа выводятся размером с заголовок,
 * а подпись под ними мелкой — так они читаются как факт, а не как строка
 * статистики.
 */
export function BigNumber({ value, caption }: { value: string; caption: string }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-display)] text-[clamp(28px,5vw,42px)] leading-none tracking-[-0.02em]">
        {value}
      </div>
      <div className="mt-2 text-sm opacity-60">{caption}</div>
    </div>
  )
}
