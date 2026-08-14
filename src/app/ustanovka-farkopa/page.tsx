import type { Metadata } from 'next'
import Link from 'next/link'
import { shareWithoutBumperCut } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { Accordion } from '@/components/ui/accordion'
import { FAQ } from '@/content/faq'
import { DOCUMENTS, DURATIONS, INCLUDED, PRICES, PRICE_NOTE, STEPS } from '@/content/ustanovka'
import { getDb } from '@/db/client'

export const metadata: Metadata = {
  title: 'Установка фаркопа в Санкт-Петербурге — цены и сроки',
  description:
    'Установка фаркопа за 3 часа с документами для ТО. Прайс на работы, подключение электрики через блок согласования, гарантия 2 года.',
  alternates: { canonical: absolute('/ustanovka-farkopa') },
}

export default async function InstallPage() {
  const db = await getDb()
  const withoutCut = await shareWithoutBumperCut(db)

  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Установка фаркопа' }]}
      title="Установка фаркопа в Петербурге"
      summary="Три часа, гарантия два года, документы для ТО. Заезжайте без записи в приёмные часы."
    >
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link
          href="/zapis"
          className="rounded-[10px] bg-accent px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Записаться
        </Link>
        <a href="tel:+78121234567" className="text-[19px] font-semibold hover:text-accent">
          +7 (812) 123-45-67
        </a>
      </div>

      <section className="mt-16">
        <h2 className="text-[19px] font-medium">Прайс на установку</h2>
        <p className="mt-2 text-sm opacity-55">Цены указаны без стоимости фаркопа</p>

        {/*
          Две колонки цен, а не одна: работа с чужим изделием стоит
          дороже, и человек должен увидеть это до приезда, а не узнать
          при расчёте.
        */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line-light text-left">
                <th className="py-3 pr-4 text-[11px] font-medium uppercase tracking-[0.12em] opacity-50">
                  Вид работы
                </th>
                <th className="py-3 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] opacity-50">
                  Наш фаркоп
                </th>
                <th className="py-3 text-right text-[11px] font-medium uppercase tracking-[0.12em] opacity-50">
                  Ваш фаркоп
                </th>
              </tr>
            </thead>
            <tbody>
              {PRICES.map((row) => (
                <tr key={row.work} className="border-b border-line-light">
                  <td className="py-3 pr-4">{row.work}</td>
                  <td className="py-3 pr-4 text-right font-medium">{row.own}</td>
                  <td className="py-3 text-right opacity-70">{row.client}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 max-w-[70ch] text-sm opacity-55">{PRICE_NOTE}</p>
      </section>

      <section className="mt-16">
        <h2 className="text-[19px] font-medium">Что входит в работу</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-card)] border border-line-light bg-white p-6"
            >
              <h3 className="text-[15px] font-medium">{item.title}</h3>
              <p className="mt-2 text-sm opacity-60">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-[19px] font-medium">Сколько занимает</h2>
          <dl className="mt-6">
            {DURATIONS.map((row) => (
              <div
                key={row.work}
                className="flex items-baseline justify-between gap-6 border-b border-line-light py-3 text-sm"
              >
                <dt className="opacity-70">{row.work}</dt>
                <dd className="shrink-0 font-medium">{row.time}</dd>
              </div>
            ))}
          </dl>

          {/*
            Доля считается по базе. В макете стояло «84%» — число с
            потолка, а человек читает его до записи и приезжает с
            расчётом, что бампер резать не будут.
          */}
          {withoutCut !== null && (
            <p className="mt-6 max-w-[60ch] text-sm opacity-60">
              {withoutCut}% фаркопов в каталоге ставятся по штатным точкам без выреза бампера. Для
              вашей машины скажем точно до записи — это видно в карточке фаркопа.
            </p>
          )}
        </section>

        <section>
          <h2 className="text-[19px] font-medium">Как проходим</h2>
          <ol className="mt-6">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="flex items-baseline gap-5 border-b border-line-light py-4 text-sm"
              >
                <span className="font-[family-name:var(--font-display)] text-[13px] opacity-35">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-16">
        <h2 className="text-[19px] font-medium">Документы и допуски</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {DOCUMENTS.map((doc) => (
            <div
              key={doc.title}
              className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line-light bg-white p-5 text-sm"
            >
              <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-white">PDF</span>
              <span>
                {doc.title}
                <span className="block text-xs opacity-50">{doc.note}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm opacity-50">Сканы приложим, когда заказчик их передаст.</p>
      </section>

      <section className="mt-16">
        <h2 className="text-[19px] font-medium">Частые вопросы</h2>
        <div className="mt-6">
          <Accordion items={FAQ} />
        </div>
      </section>
    </CatalogShell>
  )
}
