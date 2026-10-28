'use client'

import { useActionState, useId, useTransition } from 'react'
import { updateOwnProductAction, type ActionResult } from '@/admin/catalog-actions'
import type { ProductSpecs } from '@/admin/products'
import { keepOnError } from './car-form'

const label = 'flex flex-col gap-1 text-[12px] text-ink-muted'

/**
 * Характеристики своего фаркопа — поля формы.
 *
 * Одни и те же в «Новом фаркопе» и в правке из «Товаров»: разойдись они
 * — и заведённое одной формой не открылось бы в другой как было.
 */
export function SpecFields({
  balls,
  initial,
}: {
  balls: string[]
  initial?: ProductSpecs & { inStock: boolean }
}) {
  const electrics = initial?.electricsIncluded === true ? 'yes' : initial?.electricsIncluded === false ? 'no' : ''
  // Своя подсказка у каждой формы: в «Товарах» их по одной на строку.
  const ballsId = useId()

  return (
    <>
      <fieldset className="grid gap-3 sm:grid-cols-4">
        <label className={label}>
          Тип шара
          <input
            name="ballType"
            list={ballsId}
            defaultValue={initial?.ballType ?? ''}
            placeholder="A, C, F…"
            className="ctl"
          />
          <datalist id={ballsId}>
            {balls.map((ball) => (
              <option key={ball} value={ball} />
            ))}
          </datalist>
        </label>
        <label className={label}>
          Тяговая нагрузка, кг
          <input
            name="towLoadKg"
            inputMode="numeric"
            defaultValue={initial?.towLoadKg ?? ''}
            placeholder="1500"
            className="ctl"
          />
        </label>
        <label className={label}>
          Вертикальная, кг
          <input
            name="verticalLoadKg"
            inputMode="numeric"
            defaultValue={initial?.verticalLoadKg ?? ''}
            placeholder="75"
            className="ctl"
          />
        </label>
        <label className={label}>
          Масса фаркопа, кг
          <input
            name="weightKg"
            inputMode="decimal"
            defaultValue={initial?.weightKg ?? ''}
            placeholder="18,5"
            className="ctl"
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <label className={label}>
          Вырез бампера
          <select name="bumperCut" defaultValue={initial?.bumperCut ?? 'unknown'} className="ctl">
            <option value="not_required">не нужен</option>
            <option value="required">нужен</option>
            <option value="unknown">не знаю</option>
          </select>
        </label>
        <label className={label}>
          Электрика в комплекте
          <select name="electrics" defaultValue={electrics} className="ctl">
            <option value="no">нет</option>
            <option value="yes">да</option>
            <option value="">не знаю</option>
          </select>
        </label>
        <label className={label}>
          Срок, если не в наличии
          <input
            name="deliveryText"
            defaultValue={initial?.deliveryText ?? ''}
            placeholder="Например, 3–5 дней"
            className="ctl"
          />
        </label>
      </fieldset>

      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          name="inStock"
          defaultChecked={initial?.inStock ?? true}
          className="h-4 w-4 accent-accent"
        />
        В наличии
      </label>
    </>
  )
}

/**
 * Правка своего фаркопа в «Товарах».
 *
 * Артикул, цена и описание здесь не повторяются — они правятся в самой
 * строке товара, как у всех.
 */
export function OwnProductSpecs({
  slug,
  manufacturer,
  manufacturers,
  balls,
  specs,
}: {
  slug: string
  manufacturer: string
  manufacturers: string[]
  balls: string[]
  specs: ProductSpecs & { inStock: boolean }
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    updateOwnProductAction.bind(null, slug),
    {},
  )
  const [, startTransition] = useTransition()
  const listId = `makers-${slug}`

  return (
    <form onSubmit={keepOnError(action, startTransition)} className="flex flex-col gap-3">
      <label className={`${label} sm:max-w-[16rem]`}>
        Производитель
        <input
          name="manufacturer"
          list={listId}
          required
          defaultValue={manufacturer}
          className="ctl"
        />
        <datalist id={listId}>
          {manufacturers.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <SpecFields balls={balls} initial={specs} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink-dark px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Сохраняю…' : 'Сохранить характеристики'}
        </button>
        {state.error && <span className="text-[13px] text-accent">{state.error}</span>}
        {state.ok && !pending && <span className="text-[13px] text-ink-dark">{state.ok}</span>}
      </div>
    </form>
  )
}
