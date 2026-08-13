import { FAQ } from '@/content/faq'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

/**
 * Вопросы.
 *
 * Аккордеон на `<details>`/`<summary>` — без единой строки JavaScript.
 * Страница остаётся полностью статической, а ответы лежат в разметке
 * и попадают в индекс независимо от того, раскрыт блок или нет.
 *
 * Разметки FAQPage здесь пока нет — она идёт в SEO-подпроекте вместе
 * с остальными типами, чтобы не расползаться по файлам.
 */
export function Faq() {
  return (
    <Section tone="dark">
      <Eyebrow>Вопросы</Eyebrow>
      <SectionTitle>Отвечаем заранее</SectionTitle>
      <SectionLead>Шесть вопросов, которые задают чаще всего</SectionLead>

      <div className="mt-12 border-t border-line">
        {FAQ.map((item, index) => (
          <details
            key={item.question}
            open={index === 0}
            className="group border-b border-line"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[clamp(17px,2vw,21px)] text-ink marker:hidden [&::-webkit-details-marker]:hidden">
              {item.question}
              {/*
                Плюс поворачивается в крестик при раскрытии — состояние
                видно, пока человек ещё не начал читать ответ.
              */}
              <span
                aria-hidden
                className="shrink-0 text-2xl font-light text-ink-dim transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-[70ch] pb-7 text-[17px] leading-relaxed text-ink-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  )
}
