import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { CONTACTS } from '@/content/contacts'
import { RATING } from '@/content/reviews'

export const metadata: Metadata = {
  title: 'О компании AUTOPROFI — сервис по установке фаркопов в Петербурге',
  description:
    'Сервис на Софийской улице с 2014 года: свои мастера, свой склад, больше 3 800 установок. Гарантия два года на работы.',
  alternates: { canonical: absolute('/o-nas') },
}

const NUMBERS = [
  { value: '12 лет', caption: 'на одном месте' },
  { value: '3 800', caption: 'установок' },
  { value: RATING.score, caption: `средняя оценка · ${RATING.count} отзывов` },
  { value: '2 года', caption: 'гарантии на работы' },
]

export default function AboutPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'О нас' }]}
      title="С 2014 года"
      summary="Один сервис на Софийской, свои мастера и свой склад. Без посредников и подрядчиков."
    >
      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {NUMBERS.map((item) => (
          <div key={item.caption}>
            <div className="font-[family-name:var(--font-display)] text-[clamp(30px,4vw,42px)] leading-none tracking-[-0.02em]">
              {item.value}
            </div>
            <div className="mt-2 text-sm opacity-60">{item.caption}</div>
          </div>
        ))}
      </div>

      <div className="mt-16 max-w-[75ch]">
        <p className="leading-relaxed opacity-75">
          Мы ставим фаркопы и занимаемся электрикой к ним. Не универсальный автосервис, где это одна
          услуга из сорока, а мастерская, которая делает одно и то же каждый день. За двенадцать лет
          через нас прошло больше трёх с половиной тысяч машин, и почти на каждую популярную модель
          у нас уже есть готовый порядок работ.
        </p>

        <p className="mt-5 leading-relaxed opacity-75">
          Из этого следует практическая вещь: мы знаем, где у какой машины проходит проводка и какие
          точки крепления прикипают. Поэтому цену называем по телефону до приезда, а не после
          осмотра — и она обычно совпадает с итоговой.
        </p>

        <p className="mt-5 leading-relaxed opacity-75">
          Электрику подключаем через блок согласования, а не врезкой в проводку напрямую. Так
          дороже и дольше, зато штатные датчики машины продолжают работать, а к дилеру нет вопросов
          по гарантии.
        </p>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-block)] border border-line-light bg-white p-8">
          <h2 className="text-[19px] font-medium">Где мы</h2>
          <p className="mt-3 text-[17px]">{CONTACTS.address}</p>
          <p className="mt-1 text-sm opacity-55">{CONTACTS.addressNote}</p>
          <p className="mt-4 text-sm opacity-55">
            {CONTACTS.hours} · {CONTACTS.dayOff}
          </p>
          <Link href="/kontakty" className="mt-5 inline-block text-accent hover:underline">
            Контакты и схема проезда →
          </Link>
        </div>

        <div className="rounded-[var(--radius-block)] border border-line-light bg-white p-8">
          <h2 className="text-[19px] font-medium">Документы</h2>
          <p className="mt-3 text-sm opacity-65">
            Сертификат СТО · ГОСТ Р и допуск на электромонтажные работы.
          </p>
          {/*
            Сканы не выкладываем, пока их нет: ссылка на несуществующий
            PDF хуже отсутствия ссылки — она обещает подтверждение,
            которого посетитель не получит.
          */}
          <p className="mt-4 text-sm opacity-50">Сканы приложим, когда заказчик их передаст.</p>
          <Link href="/otzyvy" className="mt-5 inline-block text-accent hover:underline">
            Отзывы клиентов →
          </Link>
        </div>
      </div>
    </CatalogShell>
  )
}
