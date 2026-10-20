import { expect, test } from 'vitest'
import { applyProductOverride, isHidden, type OverridableProduct } from './overrides'

const base: OverridableProduct = {
  slug: 'a101-a',
  article: 'A101-A',
  description: 'Фаркоп на Audi 100',
  price: 12420,
  photo: '/images/products/a101-a.webp',
}

test('без правок товар остаётся как в выгрузке', () => {
  expect(applyProductOverride(base, undefined)).toEqual(base)
  expect(applyProductOverride(base, {})).toEqual(base)
})

test('цена владельца побеждает цену поставщика', () => {
  expect(applyProductOverride(base, { price: '13900' }).price).toBe(13900)
})

test('битая цена не попадает на витрину', () => {
  // Строка из базы может оказаться любой. «NaN ₽» на карточке товара
  // хуже, чем цена поставщика: вторая хотя бы число.
  for (const broken of ['', 'дорого', '-500', '0', 'NaN']) {
    expect(applyProductOverride(base, { price: broken }).price).toBe(base.price)
  }
})

test('правятся название, описание и картинка', () => {
  const result = applyProductOverride(base, {
    article: 'A101-A спец',
    description: 'Своё описание',
    photo: '/images/products/own.webp',
  })
  expect(result.article).toBe('A101-A спец')
  expect(result.description).toBe('Своё описание')
  expect(result.photo).toBe('/images/products/own.webp')
})

test('правка одного поля не трогает остальные', () => {
  const result = applyProductOverride(base, { price: '9000' })
  expect(result.article).toBe(base.article)
  expect(result.description).toBe(base.description)
  expect(result.photo).toBe(base.photo)
})

test('скрытие читается только по явной единице', () => {
  expect(isHidden({ hidden: '1' })).toBe(true)
  expect(isHidden({ hidden: '0' })).toBe(false)
  expect(isHidden({})).toBe(false)
  expect(isHidden(undefined)).toBe(false)
})
