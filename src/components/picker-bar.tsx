'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import type { PickerBrand } from '@/catalog/queries'
import { urls } from '@/catalog/urls'

/**
 * Строка подбора: марка, модель, кузов и годы.
 *
 * Стоит сразу под шапкой на главной и на страницах каталога — это
 * основной вход в подбор, и он не должен переезжать от страницы
 * к странице.
 *
 * Списки связанные: модель нельзя выбрать раньше марки, кузов раньше
 * модели. Это не придирка к порядку — фаркоп подбирается по кузову и
 * годам, а не по модели: у одного RAV4 пять поколений с разными
 * точками крепления, и выбор без кузова даёт ложное совпадение.
 *
 * Справочник грузится не сразу, а при первом обращении к спискам:
 * подбор нужен не каждому посетителю, а весит он больше самой
 * страницы.
 */
const FIELD =
  'flex-1 rounded-[10px] border px-4 py-3 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-45'
const FIELD_ACTIVE = 'border-white/12 bg-surface-3 text-ink'
const FIELD_REST = 'border-white/6 bg-surface-3/50 text-ink'

type State = 'loading' | 'ready' | 'error'

export function PickerBar({
  brand,
  model,
  variant,
  transparent = false,
}: {
  /** Выбранные значения, если страница уже сузила подбор. */
  brand?: string
  model?: string
  variant?: string
  /** На первом экране строка лежит на фотографии, своего фона у неё нет. */
  transparent?: boolean
} = {}) {
  const router = useRouter()
  const id = useId()

  const [index, setIndex] = useState<PickerBrand[]>([])
  const [state, setState] = useState<State>('loading')
  const [brandSlug, setBrandSlug] = useState('')
  const [modelSlug, setModelSlug] = useState('')
  const [variantSlug, setVariantSlug] = useState('')

  /*
    Справочник тянется сразу после отрисовки, а не по касанию списка.
    На телефоне нажатие на список открывает выбор мгновенно, и если
    ждать этого момента, человек увидит пустоту. Запрос идёт уже после
    того, как страница показана, и её появление не задерживает.
  */
  useEffect(() => {
    let живой = true
    fetch('/podbor.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: PickerBrand[]) => {
        if (!живой) return
        setIndex(data)
        setState('ready')
      })
      .catch(() => {
        if (живой) setState('error')
      })
    return () => {
      живой = false
    }
  }, [])

  // Значения со страницы подставляются, когда справочник доехал:
  // страница знает названия, а списки работают по адресам.
  useEffect(() => {
    if (state !== 'ready' || !brand) return
    const found = index.find((b) => b.n === brand)
    if (!found) return
    setBrandSlug(found.s)

    if (!model) return
    const foundModel = found.m.find((m) => m.n === model)
    if (!foundModel) return
    setModelSlug(foundModel.s)

    if (!variant) return
    const foundVariant = foundModel.v.find((v) => v.n === variant)
    if (foundVariant) setVariantSlug(foundVariant.s)
  }, [state, index, brand, model, variant])

  const currentBrand = index.find((b) => b.s === brandSlug)
  const currentModel = currentBrand?.m.find((m) => m.s === modelSlug)
  const currentVariant = currentModel?.v.find((v) => v.s === variantSlug)

  /**
   * Куда ведёт кнопка.
   *
   * Чем точнее выбор, тем глубже адрес. У кузова без своей страницы
   * ведём на модель: такая страница дублировала бы её, поэтому её и
   * не существует.
   */
  const target = (() => {
    if (!brandSlug) return urls.catalog()
    if (!modelSlug) return urls.brand(brandSlug)
    if (!variantSlug || !currentVariant) return urls.model(brandSlug, modelSlug)
    return currentVariant.p
      ? urls.variant(brandSlug, modelSlug, variantSlug)
      : urls.model(brandSlug, modelSlug)
  })()

  const selectClass = (filled: boolean) => `${FIELD} ${filled ? FIELD_ACTIVE : FIELD_REST}`

  return (
    <div
      className={
        transparent
          ? 'border-b border-white/8 bg-[rgba(10,10,11,0.72)] backdrop-blur-[22px] backdrop-saturate-[1.3]'
          : 'bg-bg pt-14'
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          router.push(target)
        }}
        className={`mx-auto flex flex-col gap-2.5 lg:flex-row ${
          transparent ? 'px-14 py-4' : 'max-w-[1400px] px-6 py-4'
        }`}
      >
        <select
          aria-label="Марка"
          value={brandSlug}
          disabled={state !== 'ready'}
          onChange={(event) => {
            setBrandSlug(event.target.value)
            setModelSlug('')
            setVariantSlug('')
          }}
          className={selectClass(Boolean(brandSlug))}
          id={`${id}-brand`}
        >
          <option value="">
            {state === 'error' ? 'Список недоступен' : state === 'loading' ? 'Загружаем…' : 'Марка'}
          </option>
          {index.map((b) => (
            <option key={b.s} value={b.s}>
              {b.n}
            </option>
          ))}
        </select>

        <select
          aria-label="Модель"
          value={modelSlug}
          disabled={!currentBrand}
          onChange={(event) => {
            setModelSlug(event.target.value)
            setVariantSlug('')
          }}
          className={selectClass(Boolean(modelSlug))}
          id={`${id}-model`}
        >
          <option value="">Модель</option>
          {currentBrand?.m.map((m) => (
            <option key={m.s} value={m.s}>
              {m.n}
            </option>
          ))}
        </select>

        <select
          aria-label="Кузов и годы"
          value={variantSlug}
          disabled={!currentModel}
          onChange={(event) => setVariantSlug(event.target.value)}
          className={selectClass(Boolean(variantSlug))}
          id={`${id}-variant`}
        >
          <option value="">Кузов и годы</option>
          {currentModel?.v.map((v) => (
            <option key={v.s} value={v.s}>
              {v.n}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="shrink-0 rounded-[10px] bg-accent px-[34px] py-3.5 text-center text-sm font-semibold text-white transition-[filter] hover:brightness-110"
        >
          Подобрать
        </button>
      </form>
    </div>
  )
}
