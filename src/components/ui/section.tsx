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
 * стопкой блоков с просветом, а не сплошным полотном.
 *
 * Содержимое НЕ центрируется в узкой колонке — в исходнике макета у
 * секций нет внутреннего max-width, только фиксированный боковой
 * отступ 56px на весь блок. Раньше здесь стоял `max-w-[1400px]
 * mx-auto`, и на широких экранах это съедало по 250+ пикселей пустоты
 * с каждой стороны: контент выглядел мельче и теснее, чем в дизайне,
 * хотя кегли были верными — просто сама колонка была уже нужного.
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
      <div className="w-full px-5 py-14 sm:px-8 sm:py-20 lg:px-14 lg:py-20 xl:py-28">
        {children}
      </div>
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
 * Заголовок секции: clamp(27,2.8vw,37) — реальное значение из
 * АUTOPROFI Дизайн-система.dc.html, роль «Секция». У акций на главной
 * заголовок крупнее (свой clamp(32,3.3vw,44)) — это единственное
 * намеренное исключение, набирается инлайн в promos.tsx.
 */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
      {children}
    </h2>
  )
}

/** Одно предложение под заголовком. Больше на главной не пишем. */
export function SectionLead({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[54ch] text-[17px] leading-[1.55] opacity-70">{children}</p>
}

/**
 * Крупное число с подписью: clamp(30,3.1vw,42) — роль «Цифра» из
 * дизайн-системы. Это НЕ то же самое, что огромные цифры в «Один
 * визит» или в акции месяца — у тех своя, более крупная шкала,
 * clamp(40,4.4vw,60) и clamp(52,6vw,76) соответственно, потому что
 * они витрина всей секции, а не подпись статистики.
 */
export function BigNumber({ value, caption }: { value: string; caption: string }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-display)] text-[clamp(30px,3.1vw,42px)] leading-none tracking-[-0.02em]">
        {value}
      </div>
      <div className="mt-2 text-[13px] opacity-60">{caption}</div>
    </div>
  )
}
