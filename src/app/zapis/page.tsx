import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { RequestForm } from '@/components/request-form'

export const metadata: Metadata = {
  title: 'Записаться на установку фаркопа в Санкт-Петербурге',
  description:
    'Оставьте номер — перезвоним в течение 15 минут в рабочие часы, подберём фаркоп и согласуем время установки.',
  alternates: { canonical: absolute('/zapis') },
}

const STEPS = [
  'Перезвоним в течение 15 минут в приёмные часы',
  'Подберём фаркоп по кузову и году выпуска',
  'Согласуем время и назовём точную сумму',
]

export default function BookingPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Запись' }]}
      title="Записаться на установку"
      summary="Работаем и без записи, но с ней быстрее — машина встанет на пост сразу по приезде."
    >
      <div className="mt-12 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <RequestForm submitLabel="Записаться" />

        <div className="grid content-start gap-10">
          <div>
            <h2 className="text-[19px] font-medium">Что дальше</h2>
            <ol className="mt-5">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  className="flex items-baseline gap-5 border-b border-line-light py-4 text-sm"
                >
                  <span className="font-[family-name:var(--font-display)] text-[13px] opacity-35">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="opacity-75">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div className="text-sm opacity-55">Или просто позвоните</div>
            <a
              href="tel:+78121234567"
              className="mt-2 block font-[family-name:var(--font-display)] text-[clamp(24px,3vw,32px)] leading-none tracking-[-0.02em] transition-colors hover:text-accent"
            >
              +7 (812) 123-45-67
            </a>
            <div className="mt-4 text-sm opacity-55">Пн–Сб 9:00–19:00 · воскресенье выходной</div>
            <div className="mt-1 text-sm opacity-55">Санкт-Петербург, Софийская ул. 72</div>
          </div>

          <div>
            <div className="text-sm opacity-55">Уже знаете, что нужно?</div>
            <Link href={urls.catalog()} className="mt-2 inline-block text-accent hover:underline">
              Подобрать фаркоп в каталоге →
            </Link>
          </div>
        </div>
      </div>
    </CatalogShell>
  )
}
