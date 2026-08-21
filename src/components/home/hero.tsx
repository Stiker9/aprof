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
 * Кадр один — Prado на набережной. Раньше здесь было два кадра со
 * сменой по CSS-анимации (фаркоп крупным планом + Prado), но под
 * prefers-reduced-motion второй кадр навсегда перекрывал первый
 * (opacity:1 без анимации, оба absolute inset-0 — верхний по DOM-порядку
 * просто закрывал нижний), и то, какое фото окажется видно, зависело
 * от системной настройки анимации, а не от того, что мы хотели
 * показать. Один статичный кадр надёжнее.
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
      {/*
        Снимок 2560x1463 (1.75:1) чуть «выше» блока, который на экране
        1920x1080 близок к 2:1 — object-cover срезает по высоте около
        13 процентов. Точка обрезки смещена немного вниз от центра:
        сверху уходит лишнее небо, а крыша машины и фаркоп на бампере
        (он примерно на 58 процентах высоты кадра) остаются целиком при
        любой ширине окна.
      */}
      <Image
        src="/images/hero-prado-4k.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[55%_15%]"
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: GRADIENT }} />

      {/* Строка подбора лежит на фотографии, сразу под пилюлей шапки */}
      <div className="absolute inset-x-0 top-14 z-[5]">
        <PickerBar transparent />
      </div>

      {/*
        В исходнике этот блок не прижат к низу — у него отступ сверху
        `padding-top: clamp(140px,20vh,200px)` от верхнего края hero
        (ГЛАВНАЯ.dc.html, обёртка текста). Раньше здесь стояло
        `bottom-0 pb-*`, и текст прилипал к самому низу секции — на
        невысоком окне браузера это выглядело так, будто заголовок
        «висит внизу», почти без отступа от цифр до края.
      */}
      <div className="absolute inset-0 px-5 pt-[clamp(120px,18vh,180px)] pb-10 sm:px-8 lg:px-14 lg:pt-[clamp(140px,20vh,200px)] lg:pb-[clamp(28px,4vh,40px)]">
        <div className="max-w-[42%] min-w-[420px] max-lg:max-w-none">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(30px,3.3vw,45px)] leading-[1.04] tracking-[-0.01em]">
            Фаркопы с установкой
            <br />в Санкт-Петербурге
          </h1>

          <p className="mt-5 max-w-[46ch] text-[clamp(14px,1.1vw,17px)] leading-[1.5] text-[#D8D8D5]">
            Подберём по марке, модели и году. Поставим за один визит — с документами для ТО.
          </p>

          <Link
            href={urls.catalog()}
            className="mt-6 inline-flex items-center gap-[18px] transition-colors hover:text-accent"
          >
            <span className="flex h-[clamp(42px,4vh,54px)] w-[clamp(42px,4vh,54px)] items-center justify-center border border-white/55">
              <span aria-hidden className="text-lg">↘</span>
            </span>
            <span className="text-[clamp(14px,1.1vw,17px)]">Подобрать фаркоп</span>
          </Link>

          {/*
            Ряд статистики набран заметно мельче заголовка и приглушённым
            цветом. Это справочные цифры под hero-строкой, а не витрина —
            в дизайн-системе роль «Цифра» так и задана: 22px флэт, без
            clamp. Разгонять их до размера заголовка значило бы спорить
            с ним за внимание, а решать здесь должен только заголовок.
          */}
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4">
            {NUMBERS.map((item) => (
              <div key={item.caption} className="flex flex-col gap-1.5">
                <span className="font-[family-name:var(--font-display)] text-[22px] leading-none">
                  {item.value ?? formatNumber(productCount)}
                </span>
                <span className="text-xs text-[#9C9C9A]">{item.caption}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
