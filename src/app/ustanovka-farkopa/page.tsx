import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { shareWithoutBumperCut } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { RequestForm } from '@/components/request-form'
import { CONTACTS } from '@/content/contacts'
import { FAQ } from '@/content/faq'
import { DOCUMENTS, DURATIONS, INCLUDED, PRICES, PRICE_NOTE, STEPS } from '@/content/ustanovka'
import { getDb } from '@/db/client'

export const metadata: Metadata = {
  title: 'Установка фаркопа в Санкт-Петербурге — цены и сроки',
  description:
    'Установка фаркопа за 3 часа с документами для ТО. Прайс на работы, подключение электрики через блок согласования, гарантия 2 года.',
  alternates: { canonical: absolute('/ustanovka-farkopa') },
}

/** Заголовки разделов внутри белого блока: 28px, средний вес, плотный трекинг. */
const SECTION_TITLE = 'text-[28px] font-medium tracking-[-0.02em]'

/** Колонки прайса фиксированные: цены должны стоять столбиком, а не плясать. */
const PRICE_ROW = 'grid grid-cols-[1fr_120px_120px] gap-6 sm:grid-cols-[1fr_180px_180px]'

/**
 * Шесть снимков из галереи — марки подобраны так, чтобы светлые и тёмные
 * кузова чередовались, иначе в ряду они сливаются. Полный набор на
 * странице /nashi-raboty.
 *
 * Артикулы не подписаны: на снимках их не видно, а выдумывать номер на
 * сайте, где по нему подбирают деталь, нельзя.
 */
const WORKS = [
  { car: 'Haval F7', photo: '/images/gallery/haval-f7.webp' },
  { car: 'Kia Rio', photo: '/images/gallery/kia-rio.webp' },
  { car: 'Nissan X-Trail', photo: '/images/gallery/nissan-x-trail.webp' },
  { car: 'Mercedes-Benz', photo: '/images/gallery/mercedes-benz.webp' },
  { car: 'Lada Largus', photo: '/images/gallery/lada-largus.webp' },
  { car: 'Skoda Rapid', photo: '/images/gallery/skoda-rapid.webp' },
]

export default async function InstallPage() {
  const db = await getDb()
  const withoutCut = await shareWithoutBumperCut(db)

  return (
    <main className="flex flex-1 flex-col gap-1.5">
      {/*
        Первый экран страницы услуги — отдельный тёмный блок с фотографией,
        а не заголовок на белом. Установка продаётся глазами: человек хочет
        увидеть, как это выглядит, прежде чем читать прайс.
      */}
      <section className="relative h-[620px] overflow-hidden rounded-[var(--radius-block)] bg-bg text-ink">
        <Image
          src="/images/ustanovka-hero-1672.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          /*
            Снимок берётся из ассетов макета в полном размере 1672 на 941.
            Раньше здесь лежала его уменьшенная копия 1200 на 675, и её
            приходилось растягивать в блок шириной 1873 — полтора раза, с
            заметным мылом. Теперь растяжение 1.12.

            Увеличения через scale больше нет: оно добавлялось ради сдвига
            кадра вбок, но снимок и так вписывается в блок ровно по ширине,
            двигать нечего — а резкость оно съедало.

            62 процента по вертикали поднимают фаркоп чуть выше середины:
            сверху уходит пустой тёмный фон.
          */
          className="object-cover object-[50%_62%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(8,8,9,0.92) 0%, rgba(8,8,9,0.6) 30%, rgba(8,8,9,0.15) 60%, rgba(8,8,9,0) 100%)',
          }}
        />

        <div className="relative flex h-full flex-col justify-end gap-5 px-5 pb-10 sm:px-8 lg:px-14 lg:pb-14">
          <Breadcrumbs
            items={[{ label: 'Главная', href: urls.home() }, { label: 'Установка фаркопа' }]}
          />

          <h1 className="font-[family-name:var(--font-display)] text-[clamp(28px,3.4vw,37px)] leading-[1.04] tracking-[-0.02em]">
            Установка фаркопа в Петербурге
          </h1>

          <p className="max-w-[520px] text-[17px] leading-[1.55] text-[#D8D8D5]">
            Три часа, гарантия два года, документы для ТО. Заезжайте без записи в приёмные часы.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#zapis"
              className="rounded-[10px] bg-accent px-[34px] py-4 text-[15px] font-semibold text-[#FFF6F4] transition-[filter] hover:brightness-110"
            >
              Записаться
            </a>
            <a href={CONTACTS.phoneHref} className="text-[26px] font-medium">
              {CONTACTS.phone}
            </a>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-14 rounded-[var(--radius-block)] bg-white px-5 py-10 text-ink-dark sm:px-8 lg:px-14 lg:py-16">
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className={SECTION_TITLE}>Прайс на установку</h2>
            <p className="text-[13px] text-[#8A8A88]">Цены указаны без стоимости фаркопа</p>
          </div>

          {/*
            Две колонки цен, а не одна: работа с чужим изделием стоит
            дороже, и человек должен увидеть это до приезда, а не узнать
            при расчёте.
          */}
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div
                className={`${PRICE_ROW} border-b border-ink-dark/[.18] py-3.5 text-xs uppercase tracking-[0.1em] text-[#8A8A88]`}
              >
                <span>Вид работы</span>
                <span className="text-right">Наш фаркоп</span>
                <span className="text-right">Ваш фаркоп</span>
              </div>

              {PRICES.map((row) => (
                <div
                  key={row.work}
                  className={`${PRICE_ROW} border-b border-ink-dark/8 py-[15px] text-[15px] transition-colors hover:bg-[#FAFAF9]`}
                >
                  <span>{row.work}</span>
                  <span className="text-right font-medium">{row.own}</span>
                  <span className="text-right text-[#6E6E6C]">{row.client}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="max-w-[720px] text-[13px] leading-[1.6] text-[#8A8A88]">{PRICE_NOTE}</p>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className={SECTION_TITLE}>Что входит в работу</h2>
          {/* Ячейки склеены зазором в пиксель — это один порядок работ, а не четыре карточки */}
          <div className="grid gap-px border border-ink-dark/10 bg-ink-dark/10 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((item) => (
              <div key={item.title} className="flex flex-col gap-2 bg-white px-6 py-[26px]">
                <h3 className="text-[18px] font-medium">{item.title}</h3>
                <p className="text-sm leading-[1.55] text-[#6E6E6C]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-14 lg:grid-cols-2">
          <section className="flex flex-col gap-5">
            <h2 className={SECTION_TITLE}>Сколько занимает</h2>
            <dl className="flex flex-col">
              {DURATIONS.map((row) => (
                <div
                  key={row.work}
                  className="flex items-center justify-between gap-6 border-b border-ink-dark/8 py-[15px] text-[15px]"
                >
                  <dt>{row.work}</dt>
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
              <p className="max-w-[60ch] text-sm leading-[1.6] text-[#6E6E6C]">
                {withoutCut}% фаркопов в каталоге ставятся по штатным точкам без выреза бампера. Для
                вашей машины скажем точно до записи — это видно в карточке фаркопа.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <h2 className={SECTION_TITLE}>Как проходим</h2>
            <ol className="flex flex-col">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-4 border-b border-ink-dark/8 py-[15px] text-[15px]"
                >
                  <span className="min-w-[44px] text-[26px] font-semibold text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-6">
            <h2 className={SECTION_TITLE}>Наши работы</h2>
            <Link href="/nashi-raboty" className="text-sm text-accent hover:underline">
              Все работы →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {WORKS.map((work) => (
              <figure key={work.photo} className="flex flex-col gap-2">
                <div className="relative flex h-[180px] items-center justify-center overflow-hidden rounded-xl bg-[#141416] text-xs text-ink-dim">
                  <Image
                    src={work.photo}
                    alt={`Установленный фаркоп на ${work.car}`}
                    fill
                    sizes="200px"
                    className="object-cover object-[50%_65%]"
                  />
                </div>
                <figcaption className="text-xs text-[#6E6E6C]">
                  {work.car}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className={SECTION_TITLE}>Документы и допуски</h2>
          <div className="grid gap-3.5 md:grid-cols-2">
            {DOCUMENTS.map((doc) => (
              <div
                key={doc.title}
                className="flex items-center gap-5 rounded-[14px] border border-ink-dark/14 px-[30px] py-7"
              >
                <span className="shrink-0 rounded-lg bg-accent px-3.5 py-[11px] text-xs font-bold tracking-[0.04em] text-[#FFF6F4]">
                  PDF
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[19px] font-medium">{doc.title}</span>
                  <span className="text-[13px] text-[#8A8A88]">{doc.note}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#8A8A88]">Сканы приложим, когда заказчик их передаст.</p>
        </section>

        <section className="flex flex-col">
          <h2 className={`${SECTION_TITLE} mb-2`}>Частые вопросы</h2>
          {FAQ.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group border-b border-ink-dark/8 py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[18px] marker:hidden [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="text-base text-[#8A8A88] transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2.5 max-w-[760px] text-[15px] leading-[1.65] text-[#6E6E6C]">
                {item.answer}
              </p>
            </details>
          ))}
        </section>
      </div>

      {/*
        Запись отдельным блоком в конце, а не ссылкой наверх: человек
        дочитал прайс и сроки — решение принимается здесь, и форма должна
        быть здесь же.
      */}
      <section
        id="zapis"
        className="flex scroll-mt-20 flex-col gap-16 rounded-[var(--radius-block)] bg-surface-2 px-5 py-10 text-ink sm:px-8 lg:flex-row lg:px-14 lg:py-16 lg:gap-20"
      >
        <div className="flex flex-1 flex-col gap-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A8A88]">
            Запись
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.05] tracking-[-0.02em]">
            Запишитесь на установку
          </h2>
          <p className="text-[15px] leading-[1.6] text-[#A8A8A5]">
            Перезвоним в течение 15 минут в рабочее время и назовём точную цену по вашей машине.
          </p>
          <a href={CONTACTS.phoneHref} className="mt-3 text-[24px] font-medium">
            {CONTACTS.phone}
          </a>
          <p className="text-sm text-[#8A8A88]">
            {CONTACTS.address} · {CONTACTS.hours}
          </p>
        </div>

        <div className="flex-1">
          <RequestForm submitLabel="Записаться" tone="dark" />
        </div>
      </section>
    </main>
  )
}
