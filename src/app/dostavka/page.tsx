import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { Tabs } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Доставка фаркопов по России и самовывоз в Санкт-Петербурге',
  description:
    'Отправляем фаркопы СДЭК в 1 100 городов, срок в пути 1–7 дней. Самовывоз с Софийской улицы в Петербурге.',
  alternates: { canonical: absolute('/dostavka') },
}

function Pickup() {
  return (
    <div className="max-w-[70ch]">
      <p className="leading-relaxed opacity-75">
        Забрать заказ можно на Софийской улице, 72. Въезд со двора, вывеска AUTOPROFI. Приезжать
        лучше в приёмные часы: Пн–Сб с 9:00 до 19:00, воскресенье выходной.
      </p>
      <p className="mt-4 leading-relaxed opacity-75">
        Если фаркоп ставим мы, забирать его отдельно не нужно — привозите машину, и уедете уже с
        установленным. Обычно это занимает около трёх часов.
      </p>
      <Link href="/ustanovka-farkopa" className="mt-5 inline-block text-accent hover:underline">
        Цены на установку →
      </Link>
    </div>
  )
}

function Cdek() {
  return (
    <div className="max-w-[70ch]">
      <p className="leading-relaxed opacity-75">
        Отправляем СДЭК — до двери или в пункт выдачи, на выбор. Номер для отслеживания приходит
        после отправки. Позиции под заказ уезжают после того, как приходят на склад: срок поставки
        указан в карточке товара.
      </p>

      <dl className="mt-8">
        {[
          ['Городов доставки', '1 100'],
          ['Срок в пути', '1–7 дней'],
          ['Способ получения', 'до двери или пункт выдачи'],
          ['Отслеживание', 'по номеру после отправки'],
        ].map(([key, value]) => (
          <div
            key={key}
            className="flex items-baseline justify-between gap-6 border-b border-line-light py-3 text-sm"
          >
            <dt className="opacity-55">{key}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {/*
        Стоимость и условия оплаты не выдумываем: тариф зависит от веса,
        габаритов и города, а порядок оплаты заказчик ещё не назвал.
        Написать «доставка от 500 ₽» значило бы назвать цену, которой
        никто не подтверждал.
      */}
      <p className="mt-8 text-sm opacity-55">
        Стоимость зависит от веса, габаритов и города — считаем при оформлении заказа. Фаркоп
        тяжёлый, поэтому тариф заметно отличается от обычной посылки.
      </p>
    </div>
  )
}

export default function DeliveryPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Доставка' }]}
      title="Доставка и самовывоз"
      summary="Все позиции каталога доступны к отправке в любой город России."
    >
      <Tabs
        name="dostavka-sposob"
        tone="light"
        className="mt-10"
        tabs={[
          { label: 'Самовывоз в Петербурге', content: <Pickup /> },
          { label: 'Доставка СДЭК', content: <Cdek /> },
        ]}
      />

      <div className="mt-16 flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
        <div className="flex-1">
          <h2 className="text-[19px] font-medium">Рассчитать доставку</h2>
          <p className="mt-2 max-w-[52ch] text-sm opacity-60">
            Назовите город и модель — посчитаем стоимость и срок.
          </p>
        </div>
        <a href="tel:+78121234567" className="text-[19px] font-semibold hover:text-accent">
          +7 (812) 123-45-67
        </a>
        <Link
          href={urls.catalog()}
          className="rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          В каталог
        </Link>
      </div>
    </CatalogShell>
  )
}
