'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CONTACTS } from '@/content/contacts'

/**
 * Панель заказа в карточке товара.
 *
 * Липкая: характеристики, документы и список машин уходят вниз на два
 * экрана, а цена и кнопка должны оставаться на виду — иначе человек,
 * дочитав до конца, ищет их прокруткой обратно.
 *
 * Переключатель получения стоит до кнопок, а не после: от него зависит
 * и срок, и итоговая сумма, и выбрать надо раньше, чем нажать.
 *
 * Здесь он сегментированный — две половины в общей рамке, — а не две
 * отдельные вкладки, как на главной. Разница смысловая: на главной это
 * два рассказа, из которых читают один, а тут два способа получить один
 * и тот же товар, и они сравниваются между собой.
 */
const TAB = 'rounded-lg py-2.5 text-center text-sm transition-colors'
const TAB_ON = 'bg-white font-medium shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
const TAB_OFF = 'text-[#6E6E6C] hover:text-ink-dark'

export function OrderPanel({
  manufacturer,
  country,
  article,
  price,
  inStock,
  stockText,
}: {
  manufacturer: string
  country: string | null
  article: string
  price: string
  inStock: boolean
  stockText: string
}) {
  const [pickup, setPickup] = useState(true)

  return (
    <aside className="flex w-full flex-col gap-4 rounded-[14px] border border-ink-dark/12 bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.05)] lg:sticky lg:top-[150px] lg:w-[380px] lg:shrink-0">
      <div className="text-xs text-[#8A8A88]">
        {manufacturer}
        {country ? ` · ${country}` : ''} · артикул {article}
      </div>

      {/* Цена акцентным цветом и крупно — это главное число на странице */}
      <div className="text-[34px] font-semibold leading-none text-accent">{price}</div>

      <div
        className={`self-start rounded-md px-3 py-1.5 text-xs font-semibold ${
          inStock ? 'bg-in-stock/12 text-in-stock' : 'bg-on-order/12 text-on-order'
        }`}
      >
        {stockText}
      </div>

      <div className="mt-1 grid grid-cols-2 gap-0.5 rounded-[10px] bg-[#F2F1EF] p-0.5">
        <button
          type="button"
          onClick={() => setPickup(true)}
          className={`${TAB} ${pickup ? TAB_ON : TAB_OFF}`}
        >
          Забрать в СПб
        </button>
        <button
          type="button"
          onClick={() => setPickup(false)}
          className={`${TAB} ${pickup ? TAB_OFF : TAB_ON}`}
        >
          Доставка СДЭК
        </button>
      </div>

      {pickup ? (
        <div className="flex flex-col gap-1.5 text-sm">
          <div>{CONTACTS.address}</div>
          <div className="text-[#6E6E6C]">Установка за 3 часа, без записи в приёмные часы</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="text-[#6E6E6C]">
            До двери или в пункт выдачи, с отслеживанием. 1 100 городов.
          </div>
          {/*
            Стоимость и срок здесь не названы: тариф зависит от веса,
            габаритов и города, а фаркоп тяжёлый. Назвать «от 590 ₽»,
            как в макете, значит пообещать цену, которой никто не
            подтверждал.
          */}
          <div className="text-[#6E6E6C]">Стоимость и срок считаем при оформлении.</div>
        </div>
      )}

      <div className="mt-1 flex flex-col gap-2.5">
        <button
          type="button"
          disabled
          className="rounded-[9px] bg-accent p-[15px] text-sm font-semibold text-[#FFF6F4] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Узнать цену
        </button>
        <Link
          href="/zapis"
          className="rounded-[9px] border border-ink-dark/20 p-[15px] text-center text-sm transition-colors hover:border-ink-dark"
        >
          Записаться на установку
        </Link>
      </div>

      <a href={CONTACTS.phoneHref} className="mt-1 text-[22px] font-medium hover:text-accent">
        {CONTACTS.phone}
      </a>
      <div className="text-xs text-[#8A8A88]">Гарантия 2 года · документы для ТО</div>
    </aside>
  )
}
