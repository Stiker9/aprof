'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatCount } from '@/catalog/format'
import type { PickerBrand } from '@/catalog/queries'
import { urls } from '@/catalog/urls'
import { PickerSelect } from '@/components/picker-select'

/**
 * Строка подбора: марка, модель, кузов и годы.
 *
 * Стоит сразу под шапкой на главной и на страницах каталога — это
 * основной вход в подбор, и он не должен переезжать от страницы
 * к странице.
 *
 * Списки связанные: модель нельзя выбрать раньше марки, кузов раньше
 * модели. Это не придирка к порядку — фаркоп подбирается по кузову и
 * годам, а не по модели: у одного RAV4 шесть поколений с разными
 * точками крепления, и выбор без кузова даёт ложное совпадение.
 */
type State = 'loading' | 'ready' | 'error'

export function PickerBar({
  brand,
  model,
  variant,
  transparent = false,
  bare = false,
}: {
  /** Выбранные значения, если страница уже сузила подбор. */
  brand?: string
  model?: string
  variant?: string
  /** На первом экране строка лежит на фотографии, своего фона у неё нет. */
  transparent?: boolean
  /** Внутри липкой полосы каталога: фон и отступы задаёт она сама. */
  bare?: boolean
} = {}) {
  const router = useRouter()

  const [index, setIndex] = useState<PickerBrand[]>([])
  const [state, setState] = useState<State>('loading')
  const [brandSlug, setBrandSlug] = useState('')
  const [modelSlug, setModelSlug] = useState('')
  const [variantSlug, setVariantSlug] = useState('')

  /*
    Справочник тянется сразу после отрисовки, а не по касанию списка.
    На телефоне нажатие открывает выбор мгновенно, и если ждать этого
    момента, человек увидит пустоту. Запрос идёт уже после того, как
    страница показана, и её появление не задерживает.
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

  return (
    <div
      className={
        bare
          ? undefined
          : transparent
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
          'px-5 py-3 sm:px-8 lg:px-14 lg:py-4'
        }`}
      >
        <PickerSelect
          label="Марка"
          value={brandSlug}
          options={index}
          loading={state === 'loading'}
          disabled={state === 'error'}
          searchHint={
            state === 'ready' ? `Поиск по ${formatCount(index.length, 'марке', 'маркам', 'маркам')}` : 'Поиск'
          }
          onChange={(slug) => {
            setBrandSlug(slug)
            setModelSlug('')
            setVariantSlug('')
          }}
        />

        <PickerSelect
          label="Модель"
          value={modelSlug}
          options={currentBrand?.m ?? []}
          disabled={!currentBrand}
          searchHint={
            currentBrand
              ? `Поиск по ${formatCount(currentBrand.m.length, 'модели', 'моделям', 'моделям')}`
              : 'Поиск'
          }
          onChange={(slug) => {
            setModelSlug(slug)
            setVariantSlug('')
          }}
        />

        <PickerSelect
          label="Кузов и годы"
          value={variantSlug}
          options={currentModel?.v ?? []}
          disabled={!currentModel}
          searchHint="Поиск по поколениям"
          onChange={setVariantSlug}
        />

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
