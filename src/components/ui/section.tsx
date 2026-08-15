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
 * Каждая секция — отдельный блок со скруглением: страница собрана
 * стопкой блоков с просветом, а не сплошным полотном. Отступы и
 * предельная ширина одинаковы у всех, поэтому держатся в одном месте.
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

/**
 * Надзаголовок: 11px, прописными, трекинг 0.24em.
 *
 * Единственное место, где кегль опускается ниже 13 — это служебная
 * подпись, а не читаемый текст. См. docs/typography.md
 */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.24em] opacity-55">{children}</p>
  )
}

/**
 * Заголовок секции.
 *
 * Отрицательный трекинг допустим: Unbounded от 30px и выше. У текста
 * трекинг всегда 0 — на мелком кегле он сминает буквы.
 */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(30px,3.2vw,46px)] leading-[1.04] tracking-[-0.03em]">
      {children}
    </h2>
  )
}

/** Одно предложение под заголовком. Больше на главной не пишем. */
export function SectionLead({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[54ch] text-[17px] leading-[1.55] opacity-70">{children}</p>
}

/**
 * Крупное число с подписью.
 *
 * Кегль один на всю страницу: такие числа читаются рядом, и разнобой
 * ломает сравнение. Меняешь здесь — меняется везде.
 */
export function BigNumber({ value, caption }: { value: string; caption: string }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-display)] text-[clamp(46px,5vw,72px)] leading-none tracking-[-0.03em]">
        {value}
      </div>
      <div className="mt-2 text-[13px] opacity-60">{caption}</div>
    </div>
  )
}
