import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { DraftNotice } from '@/components/draft-notice'
import { CONTACTS } from '@/content/contacts'

export const metadata: Metadata = {
  title: 'Гарантия на фаркопы и установку',
  description:
    'Два года гарантии на выполненные работы, гарантия производителя на изделие. Что делать при неисправности и что в гарантию не входит.',
  alternates: { canonical: absolute('/garantiya') },
}

const TERMS = [
  {
    title: 'На работы — 2 года',
    text: 'Крепление, сварные швы, антикоррозийная обработка и подключение электрики. Если что-то из этого подвело — переделываем бесплатно.',
  },
  {
    title: 'На изделие — гарантия производителя',
    text: 'Срок устанавливает завод и указывает в паспорте изделия. Обычно от года до пяти лет в зависимости от марки.',
  },
  {
    title: 'Документы выдаём сразу',
    text: 'Акт установки и сертификат соответствия на изделие — они же нужны для техосмотра.',
  },
]

const NOT_COVERED = [
  'Механические повреждения от удара или наезда',
  'Превышение допустимой нагрузки, указанной в паспорте изделия',
  'Работы, выполненные после нас в другом сервисе',
  'Коррозия из-за самостоятельного сверления или сварки',
]

export default function WarrantyPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Гарантия' }]}
      title="Гарантия"
      summary="Два года на работы и гарантия производителя на само изделие."
    >
      <DraftNotice>
        Условия описаны по обычному порядку работы сервиса и ждут подтверждения заказчика. Сроки и
        исключения могут отличаться.
      </DraftNotice>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {TERMS.map((term) => (
          <div
            key={term.title}
            className="rounded-[var(--radius-block)] border border-line-light bg-white p-7"
          >
            <h2 className="text-[17px] font-medium">{term.title}</h2>
            <p className="mt-3 text-sm leading-relaxed opacity-65">{term.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-16 max-w-[75ch]">
        <h2 className="text-[19px] font-medium">Если что-то не так</h2>
        <p className="mt-4 leading-relaxed opacity-75">
          Позвоните и опишите, что происходит. Обычно достаточно приехать — осмотр по гарантийному
          обращению бесплатный. Возьмите с собой акт установки: по нему мы найдём, что именно и
          когда ставили.
        </p>
        <a
          href={CONTACTS.phoneHref}
          className="mt-5 inline-block text-[19px] font-semibold hover:text-accent"
        >
          {CONTACTS.phone}
        </a>
      </section>

      <section className="mt-16 max-w-[75ch]">
        <h2 className="text-[19px] font-medium">Что в гарантию не входит</h2>
        <ul className="mt-5">
          {NOT_COVERED.map((item) => (
            <li key={item} className="border-b border-line-light py-3 text-sm opacity-70">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm opacity-55">
          Спорные случаи разбираем осмотром, а не перепиской: причину повреждения почти всегда видно
          на месте.
        </p>
      </section>

      <div className="mt-16">
        <Link href="/ustanovka-farkopa" className="text-accent hover:underline">
          Что входит в установку →
        </Link>
      </div>
    </CatalogShell>
  )
}
