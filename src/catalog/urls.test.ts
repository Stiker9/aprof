import { expect, test } from 'vitest'
import { absolute, SITE_URL, urls } from './urls'

test('пути каталога', () => {
  expect(urls.home()).toBe('/')
  expect(urls.catalog()).toBe('/farkopy')
  expect(urls.brand('toyota')).toBe('/farkopy/toyota')
  expect(urls.model('toyota', 'rav4')).toBe('/farkopy/toyota/rav4')
  expect(urls.variant('toyota', 'rav4', 'xa10-1995-2000')).toBe(
    '/farkopy/toyota/rav4/xa10-1995-2000',
  )
  expect(urls.product('t030a')).toBe('/tovar/t030a')
})

test('абсолютный адрес склеивается без двойного слэша', () => {
  expect(absolute('/farkopy/toyota')).toBe(`${SITE_URL}/farkopy/toyota`)
  expect(absolute('/')).toBe(`${SITE_URL}/`)
})
