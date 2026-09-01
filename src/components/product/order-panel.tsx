'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatPrice } from '@/catalog/format'
import { CONTACTS } from '@/content/contacts'
import { ELECTRICS } from '@/content/ustanovka'

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
  priceValue,
  electricsIncluded,
  inStock,
  stockText,
}: {
  manufacturer: string
  country: string | null
  article: string
  price: string
  /** Цена числом — для пересчёта комплекта с электрикой. */
  priceValue: number
  /** Входит ли электрика в комплект. Тогда выбирать нечего. */
  electricsIncluded: boolean | null
  inStock: boolean
  stockText: string
}) {
  const [pickup, setPickup] = useState(true)
  const [electrics, setElectrics] = useState(ELECTRICS[0].id)

  const chosen = ELECTRICS.find((e) => e.id === electrics) ?? ELECTRICS[0]
  const total = priceValue + chosen.price

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

      {/*
        Выбор электрики. Заказчик попросил, чтобы человек, выбрав фаркоп,
        сразу видел стоимость комплекта без установки.

        Позиции универсальные и подходят к любому фаркопу, поэтому выбор
        стоит на каждой карточке. Кроме тех, где электрика уже входит в
        комплект: предлагать её второй раз незачем — таких товаров в
        каталоге два, но обработать их всё равно надо.

        Список, а не плитки с картинками, как у конкурента: снимков этих
        позиций у нас нет, и рисовать пустые рамки под них незачем.
      */}
      {electricsIncluded ? (
        <div className="rounded-[10px] bg-[#F2F1EF] px-4 py-3 text-sm text-[#6E6E6C]">
          Электрика входит в комплект — докупать ничего не нужно.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-[#8A8A88]">Электрика</div>
          <div className="flex flex-col gap-1.5">
            {ELECTRICS.map((option) => {
              const active = option.id === electrics
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setElectrics(option.id)}
                  aria-pressed={active}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-accent bg-accent-soft'
                      : 'border-ink-dark/12 hover:border-ink-dark/30'
                  }`}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium leading-tight">{option.label}</span>
                    <span className="text-[11px] leading-tight text-[#8A8A88]">{option.note}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-medium">
                    {option.price === 0 ? '—' : `+${formatPrice(option.price)}`}
                  </span>
                </button>
              )
            })}
          </div>

          {/*
            Итог показываем, только когда электрика выбрана: без неё это
            была бы та же цена, что крупно набрана выше, и вторая строка
            с тем же числом читалась бы как ошибка.
          */}
          {chosen.price > 0 ? (
            <div className="mt-1 flex items-baseline justify-between border-t border-ink-dark/10 pt-2.5">
              <span className="text-sm">Комплект без установки</span>
              <span className="text-[19px] font-semibold text-accent">{formatPrice(total)}</span>
            </div>
          ) : null}
        </div>
      )}

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
