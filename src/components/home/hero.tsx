import Image from 'next/image'
import Link from 'next/link'
import { formatNumber } from '@/catalog/format'
import { urls } from '@/catalog/urls'

/**
 * Строка подбора.
 *
 * Пока это разметка без работы: списки не раскрываются, кнопка ведёт
 * в каталог. Живой подбор требует клиентского состояния и связанных
 * списков на 106 марок — отдельная задача.
 */
function PickerBar() {
  const fields = ['Марка', 'Модель', 'Кузов и годы']

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 py-4 lg:flex-row">
        {fields.map((label) => (
          <div
            key={label}
            className="flex flex-1 items-center justify-between rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted"
          >
            {label}
            <span aria-hidden className="text-xs opacity-50">
              ▾
            </span>
          </div>
        ))}
        <Link
          href={urls.catalog()}
          className="rounded-lg bg-accent px-8 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Подобрать
        </Link>
      </div>
    </div>
  )
}

export function Hero({ productCount }: { productCount: number }) {
  return (
    <>
      <PickerBar />

      <section className="relative overflow-hidden bg-bg">
        {/*
          Фотография занимает правую половину и растворяется к левому краю.
          Без градиента текст ложится прямо на кузов и местами пропадает.
        */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] lg:block">
          <Image
            src="/images/towbar-hero.webp"
            alt=""
            fill
            priority
            sizes="62vw"
            className="object-cover object-left"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 py-20 md:py-28">
          <div className="max-w-[50%] min-w-[320px] max-lg:max-w-none">
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim">
              Подбор · Установка · Электрика
            </p>

            {/*
              Размер привязан к ширине окна, а не задан числом: Unbounded
              широкий, и на 45px «Фаркопы с установкой» не влезает в колонку
              уже при 1200px — заголовок ломается на три строки вместо двух.
            */}
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(30px,3.2vw,44px)] leading-[1.08] tracking-[-0.01em] text-ink">
              Фаркопы с установкой
              <br />в Санкт-Петербурге
            </h1>

            <p className="mt-6 max-w-[46ch] text-[17px] text-ink-muted">
              Подберём по марке, модели и году. Поставим за один визит — с документами для ТО.
            </p>

            <Link
              href={urls.catalog()}
              className="mt-8 inline-flex items-center gap-4 text-ink transition-colors hover:text-accent"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line">
                <span aria-hidden>↘</span>
              </span>
              Подобрать фаркоп
            </Link>

            <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <div className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,42px)] leading-none tracking-[-0.02em] text-ink">
                  {formatNumber(productCount)}
                </div>
                <div className="mt-2 text-sm text-ink-muted">фаркопов в наличии</div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,42px)] leading-none tracking-[-0.02em] text-ink">
                  2 года
                </div>
                <div className="mt-2 text-sm text-ink-muted">гарантии на работы</div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,42px)] leading-none tracking-[-0.02em] text-ink">
                  3 часа
                </div>
                <div className="mt-2 text-sm text-ink-muted">средняя установка</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
