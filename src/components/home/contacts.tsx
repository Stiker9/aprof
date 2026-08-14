import { RequestForm } from '@/components/request-form'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

const PHONE = '+7 (812) 123-45-67'
const PHONE_HREF = 'tel:+78121234567'
const EMAIL = 'hello@autoprofi.spb.ru'
const ADDRESS = 'Санкт-Петербург, Софийская ул. 72'

/** Контакты с формой заявки — последняя секция главной перед подвалом. */
export function Contacts() {
  return (
    <Section tone="light">
      <Eyebrow>Контакты</Eyebrow>
      <SectionTitle>Приезжайте или позвоните</SectionTitle>
      <SectionLead>
        Работаем без записи, но с ней быстрее. Оставьте номер — перезвоним в течение 15 минут в
        рабочие часы.
      </SectionLead>

      <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <RequestForm />

        <div className="grid content-start gap-8">
          <div>
            <div className="text-sm opacity-55">Адрес</div>
            <div className="mt-2 text-[19px]">{ADDRESS}</div>
            <div className="mt-1 text-sm opacity-55">Въезд со двора, вывеска AUTOPROFI</div>
          </div>

          <div>
            <div className="text-sm opacity-55">Телефон</div>
            <a
              href={PHONE_HREF}
              className="mt-2 block font-[family-name:var(--font-display)] text-[clamp(24px,3vw,32px)] leading-none tracking-[-0.02em] transition-colors hover:text-accent"
            >
              {PHONE}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Почта</div>
            <a href={`mailto:${EMAIL}`} className="mt-2 block text-[19px] hover:text-accent">
              {EMAIL}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Часы работы</div>
            <div className="mt-2 text-[19px]">Пн–Сб 9:00–19:00</div>
            <div className="mt-1 text-sm opacity-55">Воскресенье — выходной</div>
          </div>

          <ArrowLink href="/kontakty">Схема проезда</ArrowLink>
        </div>
      </div>
    </Section>
  )
}
