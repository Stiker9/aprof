import type { Metadata } from 'next'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { RequestForm } from '@/components/request-form'
import { CONTACTS, LEGAL_ENTITY } from '@/content/contacts'

export const metadata: Metadata = {
  title: 'Контакты — AUTOPROFI, Санкт-Петербург',
  description:
    'Адрес сервиса на Софийской улице, телефон, часы работы и форма заявки. Перезваниваем в течение 15 минут в рабочие часы.',
  alternates: { canonical: absolute('/kontakty') },
}

export default function ContactsPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Контакты' }]}
      title="Приезжайте или позвоните"
      summary="Работаем без записи, но с ней быстрее. Оставьте номер — перезвоним в течение 15 минут в рабочие часы."
    >
      <div className="mt-12 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <RequestForm />

        <div className="grid content-start gap-8">
          <div>
            <div className="text-sm opacity-55">Адрес</div>
            <div className="mt-2 text-[19px]">{CONTACTS.address}</div>
            <div className="mt-1 text-sm opacity-55">{CONTACTS.addressNote}</div>
          </div>

          <div>
            <div className="text-sm opacity-55">Телефон</div>
            <a
              href={CONTACTS.phoneHref}
              className="mt-2 block font-[family-name:var(--font-display)] text-[clamp(24px,3vw,32px)] leading-none tracking-[-0.02em] transition-colors hover:text-accent"
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
            <div className="mt-1 text-sm opacity-55">
              Воскресенье — выходной
            </div>
          </div>

          {/*
            Карта не встроена: любой картографический виджет тянет чужие
            скрипты и счётчики, а страница должна оставаться быстрой и
            не отдавать посетителей стороннему домену без нужды.
            Появится вместе с точной точкой на карте от заказчика.
          */}
          <div>
            <div className="text-sm opacity-55">Реквизиты</div>
            <div className="mt-2 text-sm opacity-75">
              {LEGAL_ENTITY.name}
              <br />
              ИНН {LEGAL_ENTITY.inn} · ОГРН {LEGAL_ENTITY.ogrn}
            </div>
          </div>
        </div>
      </div>
    </CatalogShell>
  )
}
