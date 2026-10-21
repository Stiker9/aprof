import { FAQ } from '@/content/faq'
import { Accordion } from '@/components/ui/accordion'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

/**
 * Вопросы на главной.
 *
 * Разметки FAQPage здесь нет намеренно: те же вопросы стоят на странице
 * установки и размечены там. Дубли разметки поисковики считают спамом.
 */
export function Faq() {
  return (
    <Section tone="dark-2" id="faq" className="scroll-mt-20">
      <Eyebrow>Вопросы</Eyebrow>
      <SectionTitle>Отвечаем заранее</SectionTitle>
      {/*
        Без числа намеренно. Раньше стояло «Шесть вопросов»: пока их
        действительно шесть, всё верно, но стоит добавить седьмой — и
        надпись врёт, а заметить это некому.

        И без слова «вопросы»: оно уже стоит надзаголовком строкой выше.
      */}
      <SectionLead>Что спрашивают чаще всего</SectionLead>

      <div className="mt-12">
        <Accordion items={FAQ} />
      </div>
    </Section>
  )
}
