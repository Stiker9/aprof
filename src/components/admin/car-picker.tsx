'use client'

import { useEffect, useState } from 'react'
import { carOptions } from '@/admin/catalog-actions'

interface Option {
  value: string
  label: string
  count: number
  addedByOwner: boolean
  id?: number
}

/**
 * Выбор машины: марка → модель → кузов.
 *
 * Списки подгружаются по шагу: моделей у иной марки под сотню, кузовов
 * у модели — до десятка, и тащить весь справочник на страницу, чтобы
 * владелец выбрал одну машину, незачем.
 *
 * В списках все машины, а не только те, что на сайте: новая, только что
 * добавленная в «Машинах», ещё без фаркопов — и как раз её и выбирают.
 * Такие помечены «новая».
 */
export function CarPicker({
  onChange,
  name,
}: {
  /** id кузова или null, пока выбор не закончен. */
  onChange?: (variantId: number | null, label: string) => void
  /** Если задано — выбранный кузов уходит в форму скрытым полем. */
  name?: string
}) {
  const [brands, setBrands] = useState<Option[]>([])
  const [models, setModels] = useState<Option[]>([])
  const [variants, setVariants] = useState<Option[]>([])
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [variant, setVariant] = useState('')

  useEffect(() => {
    void carOptions().then(setBrands)
  }, [])

  useEffect(() => {
    setModels([])
    setModel('')
    if (brand) void carOptions(brand).then(setModels)
  }, [brand])

  useEffect(() => {
    setVariants([])
    setVariant('')
    if (brand && model) void carOptions(brand, model).then(setVariants)
  }, [brand, model])

  const chosen = variants.find((v) => v.value === variant)

  useEffect(() => {
    const label = chosen
      ? [
          brands.find((b) => b.value === brand)?.label,
          models.find((m) => m.value === model)?.label,
          chosen.label,
        ]
          .filter(Boolean)
          .join(' ')
      : ''
    onChange?.(chosen?.id ?? null, label)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, variants])

  const show = (option: Option) =>
    `${option.label}${option.addedByOwner ? ' · новая' : option.count ? ` · ${option.count}` : ''}`

  return (
    <div className="flex flex-wrap gap-2">
      <select className="ctl sm:w-44" value={brand} onChange={(e) => setBrand(e.target.value)}>
        <option value="">Марка</option>
        {brands.map((option) => (
          <option key={option.value} value={option.value}>
            {show(option)}
          </option>
        ))}
      </select>
      <select
        className="ctl sm:w-44"
        value={model}
        disabled={!brand}
        onChange={(e) => setModel(e.target.value)}
      >
        <option value="">{brand ? 'Модель' : 'Сначала марка'}</option>
        {models.map((option) => (
          <option key={option.value} value={option.value}>
            {show(option)}
          </option>
        ))}
      </select>
      <select
        className="ctl sm:w-48"
        value={variant}
        disabled={!model}
        onChange={(e) => setVariant(e.target.value)}
      >
        <option value="">{model ? 'Кузов и годы' : 'Сначала модель'}</option>
        {variants.map((option) => (
          <option key={option.value} value={option.value}>
            {show(option)}
          </option>
        ))}
      </select>
      {name ? <input type="hidden" name={name} value={chosen?.id ?? ''} /> : null}
    </div>
  )
}
