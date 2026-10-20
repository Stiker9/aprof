import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { DraftNotice } from '@/components/draft-notice'
import { LegalBody, LegalSection } from '@/components/legal-text'
import { CONTACTS, LEGAL_ENTITY } from '@/content/contacts'

export const metadata: Metadata = {
  title: 'Пользовательское соглашение',
  description: 'Условия использования сайта: статус сведений о товарах, цены, порядок заказа.',
  alternates: { canonical: absolute('/polzovatelskoe-soglashenie') },
  robots: { index: false, follow: true },
}

/** Черновик. См. пояснение в politika-konfidencialnosti/page.tsx */
export default function TermsPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Пользовательское соглашение' }]}
      title="Пользовательское соглашение"
      summary="Условия использования сайта"
    >
      <DraftNotice>Реквизиты не заполнены, текст не проверен юристом.</DraftNotice>

      <LegalBody>
        <LegalSection number={1} title="Стороны">
          <p>
            Соглашение заключается между {LEGAL_ENTITY.name} (ИНН {LEGAL_ENTITY.inn}) и любым
            посетителем сайта. Пользуясь сайтом, посетитель принимает его условия.
          </p>
        </LegalSection>

        <LegalSection number={2} title="Сведения о товарах">
          <p>
            Характеристики, изображения и описания изделий приводятся по данным производителей и
            поставщиков. Производитель вправе менять конструкцию и комплектацию без уведомления,
            поэтому сведения на сайте носят справочный характер.
          </p>
          <p>
            Совместимость изделия с конкретным автомобилем определяется по кузову и году выпуска.
            Окончательно её подтверждает сотрудник при оформлении заявки.
          </p>
        </LegalSection>

        <LegalSection number={3} title="Цены и публичная оферта">
          <p>
            Цены на сайте не являются публичной офертой. Итоговая стоимость называется при
            подтверждении заявки и может отличаться, если фактический объём работ отличается от
            типового.
          </p>
        </LegalSection>

        <LegalSection number={4} title="Заявки">
          <p>
            Форма на сайте оставляет заявку на обратный звонок, а не оформляет покупку. Договор
            считается заключённым после согласования состава работ и стоимости с сотрудником.
          </p>
        </LegalSection>

        <LegalSection number={5} title="Ответственность">
          <p>
            Владелец сайта не отвечает за последствия самостоятельной установки изделия, а также за
            повреждения, вызванные превышением нагрузок, указанных в паспорте изделия.
          </p>
        </LegalSection>

        <LegalSection number={6} title="Обратная связь">
          <p>
            Вопросы по работе сайта — на {CONTACTS.email} или по телефону {CONTACTS.phone}.
          </p>
        </LegalSection>
      </LegalBody>

      <p className="mt-12 text-sm opacity-55">
        Обработка персональных данных описана в{' '}
        <Link href="/politika-konfidencialnosti" className="text-accent underline">
          политике конфиденциальности
        </Link>
        .
      </p>
    </CatalogShell>
  )
}
