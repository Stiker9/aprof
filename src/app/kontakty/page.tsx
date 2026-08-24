import type { Metadata } from 'next'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { RequestForm } from '@/components/request-form'
import { CONTACTS, LEGAL_ENTITY } from '@/content/contacts'

export const metadata: Metadata = {
  title: 'Контакты — AUTOPROFI, Санкт-Петербург',
  description:
    'Адрес сервиса на 1-й Жерновской улице, телефон, часы работы и форма заявки. Перезваниваем в течение 15 минут в рабочие часы.',
  alternates: { canonical: absolute('/kontakty') },
}

export default function ContactsPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Контакты' }]}
      title="Оставьте номер — перезвоним"
      summary="Можно приехать без записи. По записи — сразу на пост, без ожидания. Перезваниваем в течение 15 минут в рабочие часы."
    >
      <div className="mt-12 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <RequestForm />

        <div className="grid content-start gap-8">
          <div>
            <div className="text-sm opacity-55">Адрес</div>
            <div className="mt-2 text-[19px]">{CONTACTS.address}</div>
            {CONTACTS.addressNote ? (
              <div className="mt-1 text-sm opacity-55">{CONTACTS.addressNote}</div>
            ) : null}
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
          </div>

          <div>
            <div className="text-sm opacity-55">Как добраться</div>
            <a
              href={CONTACTS.routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-[19px] text-accent hover:underline"
            >
              Построить маршрут <span aria-hidden>→</span>
            </a>
          </div>

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

      {/*
        Карта грузится лениво: виджет тянет чужие скрипты, и делать это
        при открытии страницы незачем — до карты ещё надо долистать.
        Заголовок у iframe обязателен, иначе для читалки это безымянная
        рамка, в которую непонятно зачем заходить.
      */}
      <div className="mt-14 overflow-hidden rounded-[var(--radius-card)] border border-line-light">
        <iframe
          src={CONTACTS.mapEmbedUrl}
          title={`Сервис AUTOPROFI на карте: ${CONTACTS.address}`}
          loading="lazy"
          allowFullScreen
          className="h-[420px] w-full border-0"
        />
      </div>
    </CatalogShell>
  )
}
