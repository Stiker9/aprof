import { RequestForm } from '@/components/request-form'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'
import { CONTACTS } from '@/content/contacts'

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

      {/*
        Не 50/50, а 480px формы и 380px контактов с зазором 80 — как
        в исходнике. Поровну разделённые колонки на широком экране
        растягивали бы поля ввода до неприличной ширины.
      */}
      <div className="mt-14 flex flex-col gap-14 lg:flex-row lg:gap-20">
        <div className="w-full lg:max-w-[480px]">
          <RequestForm />
        </div>

        <div className="grid w-full content-start gap-7 lg:w-[380px] lg:shrink-0">
          <div>
            <div className="text-sm opacity-55">Адрес</div>
            <div className="mt-2 text-[19px]">{CONTACTS.address}</div>
            <div className="mt-1 text-sm opacity-55">{CONTACTS.addressNote}</div>
          </div>

          <div>
            <div className="text-sm opacity-55">Телефон</div>
            <a
              href={CONTACTS.phoneHref}
              className="mt-2 block font-[family-name:var(--font-display)] text-[24px] leading-none transition-colors hover:text-accent"
            >
              {CONTACTS.phone}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Почта</div>
            <a href={CONTACTS.emailHref} className="mt-2 block text-[19px] hover:text-accent">
              {CONTACTS.email}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Часы работы</div>
            <div className="mt-2 text-[19px]">{CONTACTS.hours}</div>
            <div className="mt-1 text-sm opacity-55">Воскресенье — выходной</div>
          </div>

          <ArrowLink href="/kontakty">Схема проезда</ArrowLink>
        </div>
      </div>
    </Section>
  )
}
