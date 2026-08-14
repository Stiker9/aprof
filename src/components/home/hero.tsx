import Image from 'next/image'
import Link from 'next/link'
import { formatNumber } from '@/catalog/format'
import { urls } from '@/catalog/urls'
import { PickerBar } from '@/components/picker-bar'

/**
 * Первый экран.
 *
 * Фотография занимает весь экран целиком и уходит под шапку — ради
 * этого шапка и сделана стеклянной: она размывает то, что под ней.
 * Если положить фото только справа и начать его под шапкой, размывать
 * будет нечего, и стекло превратится в серую полосу.
 *
 * Градиент снят с макета: слева почти непрозрачный, к 48% ширины
 * сходит на нет. Без него текст ложится прямо на кузов и пропадает.
 */
/*
 * Задаётся стилем, а не классом Tailwind: класс, собранный из
 * переменной, сборщик не увидит — он читает исходник как текст,
 * и правило просто не попадёт в CSS.
 */
const GRADIENT =
  'linear-gradient(90deg, rgba(8,8,9,0.9) 0%, rgba(8,8,9,0.55) 22%, rgba(8,8,9,0.12) 36%, rgba(8,8,9,0) 48%, rgba(8,8,9,0) 100%)'

const NUMBERS = [
  { value: null, caption: 'фаркопов в наличии' },
  { value: '2 года', caption: 'гарантии на работы' },
  { value: '3 часа', caption: 'средняя установка' },
]

export function Hero({ productCount }: { productCount: number }) {
  return (
    <section className="relative isolate min-h-[704px] overflow-hidden rounded-[var(--radius-block)] bg-bg">
      <Image
        src="/images/towbar-hero.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10" style={{ background: GRADIENT }} />

      {/* Отступ под шапку: она вынута из потока и лежит поверх */}
      <div className="h-14" />

      <PickerBar transparent />

      <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-12">
        <div className="max-w-[46%] min-w-[320px] max-lg:max-w-none">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim">
            Подбор · Установка · Электрика
          </p>

          <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(30px,3.4vw,45px)] leading-[1.08] tracking-[-0.01em] text-ink">
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
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25">
              <span aria-hidden>↘</span>
            </span>
            Подобрать фаркоп
          </Link>

          <div className="mt-12 flex flex-wrap gap-x-14 gap-y-6">
            {NUMBERS.map((item) => (
              <div key={item.caption}>
                <div className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,42px)] leading-none tracking-[-0.02em] text-ink">
                  {item.value ?? formatNumber(productCount)}
                </div>
                <div className="mt-2 text-sm text-ink-muted">{item.caption}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
