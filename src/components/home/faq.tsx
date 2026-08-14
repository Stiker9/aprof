import { FAQ } from '@/content/faq'
import { Accordion } from '@/components/ui/accordion'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

/**
 * Вопросы на главной.
 *
 * Разметки FAQPage здесь пока нет — она идёт в SEO-подпроекте вместе
 * с остальными типами, чтобы не расползаться по файлам.
 */
export function Faq() {
  return (
    <Section tone="dark-2">
      <Eyebrow>Вопросы</Eyebrow>
      <SectionTitle>Отвечаем заранее</SectionTitle>
      <SectionLead>Шесть вопросов, которые задают чаще всего</SectionLead>

      <div className="mt-12">
        <Accordion items={FAQ} />
      </div>
    </Section>
  )
}
