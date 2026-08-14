import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'

export const metadata: Metadata = {
  title: 'Услуги — установка фаркопа, электрика, подбор, ремонт ТСУ',
  description:
    'Установка фаркопа, подключение розетки через блок согласования, подбор по кузову и году, сварка и ремонт тягово-сцепных устройств.',
  alternates: { canonical: absolute('/uslugi') },
}

/**
 * Четыре услуги — те, что заказчик подтвердил.
 *
 * У каждой свой якорь: на них ведут ссылки из подвала. Отдельных
 * страниц под услуги пока нет — по абзацу текста на страницу дало бы
 * четыре пустышки, а сайт продвигается в поиске, и тонкие страницы
 * тянут вниз весь хост.
 */
const SERVICES = [
  {
    id: 'ustanovka',
    title: 'Установка фаркопа',
    text: 'Монтаж по штатным точкам крепления с антикоррозийной обработкой. Сверление кузова обычно не требуется — если для вашей машины оно всё-таки нужно, предупредим до начала работ. Выдаём сертификат соответствия и акт установки.',
    href: '/ustanovka-farkopa',
    linkLabel: 'Цены на установку',
  },
  {
    id: 'elektrika',
    title: 'Электрика и розетка',
    text: 'Подключаем через блок согласования, а не врезкой в проводку напрямую. Штатная электроника машины продолжает работать как прежде: парктроник, датчики, бортовой компьютер. Ставим розетки на 7 и 13 контактов.',
  },
  {
    id: 'podbor',
    title: 'Подбор и консультация',
    text: 'Сверяем кузов и год выпуска, а не только марку с моделью: у одной модели за годы сменяется несколько поколений, и крепёжные точки у них разные. Подскажем, какой тип шара подходит под вашу нагрузку.',
    href: urls.catalog(),
    linkLabel: 'Перейти в каталог',
  },
  {
    id: 'remont-tsu',
    title: 'Сварка и ремонт ТСУ',
    text: 'Восстанавливаем повреждённые тягово-сцепные устройства, меняем шары и крепёж, дорабатываем под нестандартные прицепы. Объём работ и стоимость считаем после осмотра.',
  },
]

export default function ServicesPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Услуги' }]}
      title="Услуги"
      summary="Один сервис на Софийской, свои мастера. Без посредников и подрядчиков."
    >
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {SERVICES.map((service) => (
          <section
            key={service.id}
            id={service.id}
            className="scroll-mt-6 rounded-[var(--radius-block)] border border-line-light bg-white p-8"
          >
            <h2 className="font-[family-name:var(--font-display)] text-[22px] leading-tight tracking-[-0.02em]">
              {service.title}
            </h2>
            <p className="mt-4 leading-relaxed opacity-70">{service.text}</p>
            {service.href ? (
              <Link href={service.href} className="mt-5 inline-block text-accent hover:underline">
                {service.linkLabel} →
              </Link>
            ) : null}
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
        <div className="flex-1">
          <h2 className="text-[19px] font-medium">Не нашли нужную работу?</h2>
          <p className="mt-2 max-w-[52ch] text-sm opacity-60">
            Позвоните — скажем, беремся ли, и сколько это займёт.
          </p>
        </div>
        <a href="tel:+78121234567" className="text-[19px] font-semibold hover:text-accent">
          +7 (812) 123-45-67
        </a>
        <Link
          href="/zapis"
          className="rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Записаться
        </Link>
      </div>
    </CatalogShell>
  )
}
