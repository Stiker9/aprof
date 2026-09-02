import { gunzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { articleKey, collisions } from './core/match'

test('ключ игнорирует пробелы, точки и дефисы', () => {
  expect(articleKey('FA 0100-E')).toBe('fa0100e')
  expect(articleKey('H.T94.A')).toBe('ht94a')
  expect(articleKey('3110.KP')).toBe('3110kp')
  expect(articleKey('A101-A')).toBe('a101a')
})

test('кириллические двойники приводятся к латинице', () => {
  // Завод пишет «3110.КР» русскими буквами, наш прайс — латинскими.
  expect(articleKey('3110.КР')).toBe(articleKey('3110.KP'))
  expect(articleKey('ТСУ-А')).toBe('tcya')
})

test('в пределах одного завода ключ не склеивает разные артикулы', () => {
  interface Catalog {
    manufacturers: { id: number; name: string }[]
    products: { article: string; manufacturerId: number }[]
  }
  const catalog = JSON.parse(
    gunzipSync(readFileSync('data/catalog.json.gz')).toString(),
  ) as Catalog

  const byManufacturer = new Map<number, string[]>()
  for (const product of catalog.products) {
    const list = byManufacturer.get(product.manufacturerId)
    if (list) list.push(product.article)
    else byManufacturer.set(product.manufacturerId, [product.article])
  }

  const names = new Map(catalog.manufacturers.map((m) => [m.id, m.name]))
  const broken: string[] = []
  for (const [id, articles] of byManufacturer) {
    const bad = collisions(articles)
    if (bad.size > 0) broken.push(`${names.get(id)}: ${[...bad.values()].flat().join(', ')}`)
  }

  // Сопоставление картинок идёт по этому ключу внутри завода. Если он
  // склеит два разных артикула, картинка уйдёт не тому товару.
  expect(broken).toEqual([])
})
