import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { DraftNotice } from '@/components/draft-notice'
import { LegalBody, LegalSection } from '@/components/legal-text'
import { CONTACTS, LEGAL_ENTITY } from '@/content/contacts'

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных',
  description: 'Текст согласия, которое посетитель даёт при отправке заявки через сайт.',
  alternates: { canonical: absolute('/soglasie-na-obrabotku') },
  robots: { index: false, follow: true },
}

/** Черновик. См. пояснение в politika-konfidencialnosti/page.tsx */
export default function ConsentPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[
        { label: 'Главная', href: urls.home() },
        { label: 'Согласие на обработку данных' },
      ]}
      title="Согласие на обработку персональных данных"
      summary="Текст, который принимает посетитель при отправке заявки"
    >
      <DraftNotice>
        Реквизиты оператора не заполнены, текст не проверен юристом.
      </DraftNotice>

      <LegalBody>
        <LegalSection number={1} title="Кому даётся согласие">
          <p>
            Отправляя форму на сайте, посетитель даёт согласие {LEGAL_ENTITY.name} (ИНН{' '}
            {LEGAL_ENTITY.inn}, адрес: {CONTACTS.address}) на обработку своих персональных данных.
          </p>
        </LegalSection>

        <LegalSection number={2} title="Какие данные передаются">
          <p>Имя, номер телефона, марка и модель автомобиля, текст комментария.</p>
        </LegalSection>

        <LegalSection number={3} title="Какие действия разрешаются">
          <p>
            Сбор, запись, систематизация, накопление, хранение, уточнение, извлечение,
            использование, блокирование, удаление и уничтожение — как с использованием средств
            автоматизации, так и без них.
          </p>
        </LegalSection>

        <LegalSection number={4} title="Для чего">
          <p>
            Чтобы связаться с посетителем по оставленной заявке, подобрать изделие под его
            автомобиль, согласовать время работ и уведомить о состоянии заказа.
          </p>
        </LegalSection>

        <LegalSection number={5} title="Срок действия и отзыв">
          <p>
            Согласие действует до его отзыва. Отозвать можно в любой момент, направив письмо на{' '}
            {CONTACTS.email} или позвонив по телефону {CONTACTS.phone}. После отзыва данные
            уничтожаются, если не обязаны храниться по закону.
          </p>
        </LegalSection>
      </LegalBody>

      <p className="mt-12 text-sm opacity-55">
        Порядок обработки описан в{' '}
        <Link href="/politika-konfidencialnosti" className="text-accent underline">
          политике конфиденциальности
        </Link>
        .
      </p>
    </CatalogShell>
  )
}
