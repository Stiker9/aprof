'use client'

import type { PickerBrand } from '@/catalog/queries'

/**
 * Выбор машины внутри карточки фильтра: марка, модель, поколение.
 *
 * Не то же самое, что строка подбора в шапке. Та ведёт на страницу
 * кузова — это переход. Здесь машина работает как ещё один фильтр:
 * список сужается на месте, рядом с типом шара и ценой. Так на
 * референсе, который прислал заказчик, и так честнее по смыслу — на
 * странице подбора всё остальное тоже фильтрует, а не уводит.
 *
 * Обычные select'ы, а не наши раскрывающиеся списки с поиском: здесь
 * они стоят в одном ряду с шестью другими полями фильтра и должны
 * выглядеть так же. Поиск по маркам живёт на странице каталога, где он
 * к месту.
 */

const FIELD =
  'h-11 w-full rounded-[10px] border border-ink-dark/15 bg-white px-3.5 text-[14px] text-ink-dark outline-none transition-colors hover:border-ink-dark/35 focus:border-accent disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-[#444442]'

export interface CarChoice {
  brand: string
  model: string
  variant: string
}

export function CarSelect({
  index,
  value,
  onChange,
}: {
  index: PickerBrand[]
  value: CarChoice
  onChange: (next: CarChoice) => void
}) {
  const brand = index.find((b) => b.s === value.brand)
  const model = brand?.m.find((m) => m.s === value.model)

  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-[#444442]">Марка</span>
        <select
          value={value.brand}
          onChange={(e) => onChange({ brand: e.target.value, model: '', variant: '' })}
          className={FIELD}
        >
          <option value="">Не выбрано</option>
          {index.map((b) => (
            <option key={b.s} value={b.s}>
              {b.n}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-[#444442]">Модель</span>
        <select
          value={value.model}
          disabled={!brand}
          onChange={(e) => onChange({ ...value, model: e.target.value, variant: '' })}
          className={FIELD}
        >
          <option value="">{brand ? 'Не выбрано' : 'Сначала марка'}</option>
          {brand?.m.map((m) => (
            <option key={m.s} value={m.s}>
              {m.n}
            </option>
          ))}
        </select>
      </label>

      {/*
        Поколение — обязательный шаг, а не уточнение: фаркоп подбирается
        по кузову и годам. У одного RAV4 шесть поколений с разными
        точками крепления, и выбор без кузова даёт ложное совпадение.
        Поэтому пока поколение не выбрано, машина не сужает список.
      */}
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-[#444442]">
          Поколение и годы
        </span>
        <select
          value={value.variant}
          disabled={!model}
          onChange={(e) => onChange({ ...value, variant: e.target.value })}
          className={FIELD}
        >
          <option value="">{model ? 'Выберите' : 'Сначала модель'}</option>
          {model?.v.map((v) => (
            <option key={v.s} value={v.s}>
              {v.n}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
