'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { CONTACTS } from '@/content/contacts'

/**
 * Как вы получите фаркоп.
 *
 * Переключатель на два состояния, а не две колонки рядом: человек либо
 * приезжает в сервис, либо заказывает доставку — сразу оба сценария ему
 * не нужны, и показывать их одновременно значит заставить читать
 * половину лишнего.
 *
 * Текст занимает левые 54%, фотография лежит подо всей секцией. Правая
 * часть намеренно пустая: там кузов и фаркоп, ради которых сюда и
 * смотрят.
 */
const TAB = 'rounded-full px-[22px] py-[11px] text-sm font-semibold transition-colors'
const TAB_ON = 'bg-paper text-ink-dark'
const TAB_OFF = 'text-[#B8B8B5] hover:text-ink'

const PRIMARY =
  'inline-flex items-center gap-3 rounded-full bg-accent px-7 py-4 text-[15px] font-semibold text-[#FFF6F4] transition-[filter] hover:brightness-110'
const SECONDARY =
  'inline-flex items-center rounded-full border border-white/28 px-[26px] py-4 text-[15px] transition-colors hover:border-white/60'

/** Крупное число с подписью в две строки — «3 / часа / средняя установка». */
function BigStat({ value, unit, caption }: { value: string; unit: string; caption: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-[family-name:var(--font-display)] text-[clamp(40px,4.4vw,60px)] leading-[.9] tracking-[-0.04em]">
        {value}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[17px]">{unit}</span>
        <span className="text-xs text-[#8A8A88]">{caption}</span>
      </span>
    </div>
  )
}

function Divider() {
  return <span aria-hidden className="hidden h-12 w-px bg-white/16 sm:block" />
}

function Spb() {
  return (
    <div className="flex flex-col gap-[34px]">
      <div className="flex max-w-[520px] flex-col gap-5">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(34px,3.8vw,52px)] leading-[1.04] tracking-[-0.03em]">
          Один визит
          <br />
          <span className="text-[#75757A]">— и вы за рулём</span>
        </h2>
        <p className="max-w-[440px] text-[17px] leading-[1.55] text-[#C6C6C3]">
          Приезжайте утром на Софийскую — уедете с фаркопом, электрикой и документами для ТО.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-[34px] gap-y-6">
        <BigStat value="3" unit="часа" caption="средняя установка" />
        <Divider />
        <div className="flex flex-col gap-1">
          <span className="text-[19px] font-semibold">Софийская, 72</span>
          <span className="text-xs text-[#8A8A88]">{CONTACTS.hours}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3.5">
        <Link href="/zapis" className={PRIMARY}>
          Записаться на установку <span aria-hidden>→</span>
        </Link>
        <Link href="/ustanovka-farkopa" className={SECONDARY}>
          Цены на установку
        </Link>
      </div>
    </div>
  )
}

function Delivery() {
  return (
    <div className="flex flex-col gap-[34px]">
      <div className="flex max-w-[520px] flex-col gap-5">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(34px,3.8vw,52px)] leading-[1.04] tracking-[-0.03em]">
          Отправим
          <br />
          <span className="text-[#75757A]">куда угодно</span>
        </h2>
        <p className="max-w-[440px] text-[17px] leading-[1.55] text-[#C6C6C3]">
          Все позиции каталога доступны к доставке в любой город России — до двери или пункта
          выдачи.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-[34px] gap-y-6">
        <BigStat value="1 100" unit="городов" caption="доставка СДЭК" />
        <Divider />
        <div className="flex flex-col gap-1">
          <span className="text-[19px] font-semibold">1–7 дней</span>
          <span className="text-xs text-[#8A8A88]">срок в пути</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3.5">
        <Link href="/dostavka" className={PRIMARY}>
          Рассчитать доставку <span aria-hidden>→</span>
        </Link>
        <Link href="/dostavka" className={SECONDARY}>
          Условия и оплата
        </Link>
      </div>
    </div>
  )
}

export function InstallDelivery() {
  const [pickup, setPickup] = useState(true)

  return (
    <section className="relative flex min-h-[calc(100vh-16px)] overflow-hidden rounded-[var(--radius-block)] bg-bg text-ink">
      <Image
        src="/images/odin-vizit.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      {/*
        Градиент гасит кадр там, где лежит текст, и отпускает к правому
        краю. Резать фотографию по границе колонки нельзя — шов виден.
      */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, #0A0A0B 0%, rgba(10,10,11,.7) 18%, rgba(10,10,11,0) 46%)',
        }}
      />

      <div className="relative z-[2] flex w-full flex-col gap-[clamp(22px,3.4vh,34px)] px-5 py-[clamp(56px,8vh,88px)] sm:px-8 lg:w-[54%] lg:shrink-0 lg:px-14 lg:pt-[clamp(72px,10vh,104px)]">
        {/*
          Надзаголовок акцентным цветом, а не серым: это единственная
          секция, где он красный, и он отмечает поворот рассказа —
          дальше речь о том, как забрать товар.
        */}
        <p className="text-[11px] uppercase tracking-[0.24em] text-accent">
          Как вы получите фаркоп
        </p>

        <div className="flex w-fit rounded-full bg-white/8 p-[5px]">
          <button
            type="button"
            onClick={() => setPickup(true)}
            className={`${TAB} ${pickup ? TAB_ON : TAB_OFF}`}
          >
            Я в Петербурге
          </button>
          <button
            type="button"
            onClick={() => setPickup(false)}
            className={`${TAB} ${pickup ? TAB_OFF : TAB_ON}`}
          >
            Другой город
          </button>
        </div>

        {pickup ? <Spb /> : <Delivery />}
      </div>
    </section>
  )
}
