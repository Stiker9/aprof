'use client'

import { useRef } from 'react'

export interface Option {
  value: string
  label: string
  /** Сколько товаров — подсказка «есть ли тут вообще что-нибудь». */
  count?: number
}

/**
 * Подбор по машине в админке: марка → модель → кузов.
 *
 * ── Почему списками, а не как на витрине ──
 *
 * На сайте подбор работает в браузере: туда загружается справочник
 * всех марок и моделей, и выбор ничего не перезагружает. Здесь это
 * было бы лишним — справочник весит заметно, а админку открывают с
 * телефона в мастерской. Выбор перезагружает страницу, зато в браузер
 * не уезжает ничего, кроме трёх списков.
 *
 * ── Почему выбор отправляет форму сам ──
 *
 * Иначе после выбора марки список моделей останется пустым, пока не
 * нажмёшь «Найти»: модели знает сервер, а не страница. Человек выберет
 * марку, увидит пустой список моделей и решит, что моделей нет.
 *
 * Кнопка «Найти» при этом остаётся — без JavaScript форма
 * отправляется ею, и подбор продолжает работать.
 *
 * ── Почему сброс вложенного выбора делается здесь ──
 *
 * Выбрали Toyota, затем RAV4, затем снова меняете марку на Kia —
 * модель `rav4` в адресе осталась бы, и Kia RAV4 не нашлось бы ничего.
 * Поэтому при смене марки стираются модель и кузов, при смене модели —
 * кузов. Поле страницы тоже стирается: после смены отбора «страница 7»
 * почти наверняка за пределами новой выдачи.
 */
export function CarFilter({
  query,
  brand,
  model,
  variant,
  brands,
  models,
  variants,
}: {
  query: string
  brand: string
  model: string
  variant: string
  brands: Option[]
  models: Option[]
  variants: Option[]
}) {
  const form = useRef<HTMLFormElement>(null)

  /** Стирает то, что ниже по цепочке, и отправляет форму. */
  function pick(level: 'brand' | 'model' | 'variant') {
    const node = form.current
    if (!node) return

    const clear = (name: string) => {
      const field = node.elements.namedItem(name)
      if (field instanceof HTMLSelectElement) field.value = ''
    }

    if (level === 'brand') {
      clear('model')
      clear('variant')
    }
    if (level === 'model') clear('variant')

    node.requestSubmit()
  }

  return (
    <form ref={form} method="get" className="flex flex-wrap items-center gap-2">
      {/*
        Страница в форму не попадает: после смены отбора оставаться на
        седьмой странице бессмысленно — в новой выдаче её может не
        быть вовсе.
      */}
      <input
        name="q"
        defaultValue={query}
        placeholder="Артикул или слово"
        className="ctl w-full sm:w-52"
        aria-label="Поиск по товарам"
      />

      <Pick
        name="brand"
        value={brand}
        options={brands}
        empty="Любая марка"
        onPick={() => pick('brand')}
      />

      <Pick
        name="model"
        value={model}
        options={models}
        empty={brand ? 'Любая модель' : 'Сначала марка'}
        disabled={!brand}
        onPick={() => pick('model')}
      />

      <Pick
        name="variant"
        value={variant}
        options={variants}
        empty={model ? 'Любой кузов' : 'Сначала модель'}
        disabled={!model}
        onPick={() => pick('variant')}
      />

      <button
        type="submit"
        className="rounded-lg bg-ink-dark px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-ink-dark/85"
      >
        Найти
      </button>

      {(query || brand) && (
        <a href="/admin/tovary" className="px-2 text-[13px] text-ink-muted hover:text-accent">
          Сбросить
        </a>
      )}
    </form>
  )
}

function Pick({
  name,
  value,
  options,
  empty,
  disabled = false,
  onPick,
}: {
  name: string
  value: string
  options: Option[]
  empty: string
  disabled?: boolean
  onPick: () => void
}) {
  return (
    <select
      name={name}
      value={value}
      disabled={disabled}
      onChange={onPick}
      aria-label={empty}
      className="ctl w-full sm:w-44"
    >
      <option value="">{empty}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {option.count === undefined ? '' : ` · ${option.count}`}
        </option>
      ))}
    </select>
  )
}
