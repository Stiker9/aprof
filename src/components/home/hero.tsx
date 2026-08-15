import Image from 'next/image'
import Link from 'next/link'
import { formatNumber } from '@/catalog/format'
import { urls } from '@/catalog/urls'
import { PickerBar } from '@/components/picker-bar'

/**
 * Первый экран.
 *
 * Занимает всё окно за вычетом полей — `calc(100vh - 16px)`, как в
 * исходнике макета, а не фиксированную высоту. Нижний предел нужен для
 * низких окон: без него на ноутбуке с невысоким экраном текст и числа
 * налезали бы друг на друга.
 *
 * Кадров два, и они плавно сменяют друг друга — фаркоп крупным планом
 * и Prado на набережной. Смена сделана анимацией в globals.css, без
 * скриптов и таймеров.
 *
 * Градиент взят из исходника: слева почти непрозрачный, к 48% ширины
 * сходит на нет. Без него текст ложится прямо на кузов и пропадает.
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
    <section className="relative h-[calc(100vh-16px)] min-h-[620px] overflow-hidden rounded-[var(--radius-block)] bg-bg text-ink">
      <Image
        src="/images/hero-farkop.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/*
        Второй кадр грузится сразу, а не лениво: он проявляется на
        четвёртой секунде, и к этому моменту должен быть готов — иначе
        человек увидит подмену пустотой вместо смены кадра.
      */}
      <Image
        src="/images/hero-prado.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-slide-second object-cover"
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: GRADIENT }} />

      {/* Строка подбора лежит на фотографии, сразу под пилюлей шапки */}
      <div className="absolute inset-x-0 top-14 z-[5]">
        <PickerBar transparent />
      </div>

      <div
        aria-hidden
        className="absolute bottom-8 right-14 z-[6] flex items-center gap-2"
      >
        <span className="hero-dot-1 block h-2 rounded-full" />
        <span className="hero-dot-2 block h-2 rounded-full" />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-14 pb-14">
        <div className="max-w-[46%] min-w-[320px] max-lg:max-w-none">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(30px,3.4vw,45px)] leading-[1.08] tracking-[-0.01em]">
            Фаркопы с установкой
            <br />в Санкт-Петербурге
          </h1>

          <p className="mt-5 max-w-[46ch] text-[17px] text-ink-muted">
            Подберём по марке, модели и году. Поставим за один визит — с документами для ТО.
          </p>

          <Link
            href={urls.catalog()}
            className="mt-8 inline-flex items-center gap-4 transition-colors hover:text-accent"
          >
            <span className="flex h-14 w-14 items-center justify-center border border-white/25">
              <span aria-hidden>↘</span>
            </span>
            Подобрать фаркоп
          </Link>

          <div className="mt-12 flex flex-wrap gap-x-14 gap-y-6">
            {NUMBERS.map((item) => (
              <div key={item.caption}>
                <div className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,42px)] leading-none tracking-[-0.02em]">
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
