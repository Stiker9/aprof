import { expect, test } from 'vitest'
import { dedupeFitments, dedupeVariants } from './dedupe'
import type { RawFitment, RawVariant } from './extract'
import { buildVariantSlugs } from './normalize'

const f = (p: number, v: number, price: number | null = 100): RawFitment => ({
  brandIndex: 0,
  modelIndex: 0,
  variantIndex: v,
  productIndex: p,
  price,
  deliveryShort: null,
})

const v = (modelIndex: number, name: string): RawVariant => ({
  key: `v:${modelIndex}:${name}`,
  modelIndex,
  name,
  sourceUrl: 'u',
})

// --- связки ---

test('схлопывает повторы одной пары товар-кузов', () => {
  expect(dedupeFitments([f(1, 1), f(1, 1), f(1, 1)])).toHaveLength(1)
})

test('не трогает разные пары', () => {
  expect(dedupeFitments([f(1, 1), f(1, 2), f(2, 1)])).toHaveLength(3)
})

test('при конфликте цен оставляет наименьшую', () => {
  expect(dedupeFitments([f(1, 1, 200), f(1, 1, 150), f(1, 1, 300)])[0].price).toBe(150)
})

test('цена null не вытесняет реальную цену', () => {
  expect(dedupeFitments([f(1, 1, null), f(1, 1, 150)])[0].price).toBe(150)
})

test('цена ноль остаётся ценой, а не считается отсутствующей', () => {
  expect(dedupeFitments([f(1, 1, 0), f(1, 1, 150)])[0].price).toBe(0)
})

test('пустой вход даёт пустой выход', () => {
  expect(dedupeFitments([])).toEqual([])
})

// --- кузова ---

/** Слаги считаются той же функцией, что и в импорте. */
const slugsOf = (list: RawVariant[]) => buildVariantSlugs(list)

test('схлопывает одинаковые кузова одной модели', () => {
  const list = [v(0, 'Киа Соренто 1 BL 2006-2009'), v(0, 'Киа Соренто 1 BL 2006-2009')]
  const { kept } = dedupeVariants(list, slugsOf(list))
  expect(kept).toHaveLength(1)
})

test('одинаковые названия у РАЗНЫХ моделей не схлопываются', () => {
  const list = [v(0, 'Соренто 2006-2009'), v(1, 'Соренто 2006-2009')]
  const { kept } = dedupeVariants(list, slugsOf(list))
  expect(kept).toHaveLength(2)
})

test('кузова, различающиеся типом, НЕ схлопываются', () => {
  // у 193 кузовов различие только в типе — если срезать его вместе с моделью,
  // седан и универсал одного года потеряют по странице
  const list = [
    v(0, 'Шевроле Лачетти седан 2004-2012'),
    v(0, 'Шевроле Лачетти универсал 2004-2012'),
    v(0, 'Шевроле Лачетти хетчбек 2004-2012'),
  ]
  const slugs = slugsOf(list)
  const { kept } = dedupeVariants(list, slugs)
  expect(kept).toHaveLength(3)
  expect(slugs).toEqual(['sedan-2004-2012', 'universal-2004-2012', 'hetchbek-2004-2012'])
})

test('общее начало срезается — марки и модели в слаге нет', () => {
  const list = [
    v(0, 'Тойота РАВ4 XA10 1995-2000'),
    v(0, 'Тойота РАВ4 XA20 2000-2006'),
  ]
  expect(slugsOf(list)).toEqual(['xa10-1995-2000', 'xa20-2000-2006'])
})

test('единственный кузов модели сохраняет название целиком', () => {
  // срезать общее начало не у чего — иначе слаг вышел бы пустым
  expect(slugsOf([v(0, 'Акура ЗДХ')])).toEqual(['akura-zdh'])
})

test('карта соответствия переводит старые индексы на оставшийся кузов', () => {
  const list = [
    v(0, 'Соренто 2006-2009'),
    v(0, 'Соренто 2006-2009'),
    v(0, 'Спортейдж 2010-2015'),
  ]
  const { indexMap } = dedupeVariants(list, slugsOf(list))
  expect(indexMap.get(0)).toBe(0)
  expect(indexMap.get(1)).toBe(0)
  expect(indexMap.get(2)).toBe(1)
})

test('карта покрывает все входные индексы', () => {
  const list = [v(0, 'А 2000-2005'), v(0, 'А 2000-2005'), v(1, 'Б 2010-2015')]
  const { indexMap } = dedupeVariants(list, slugsOf(list))
  expect(indexMap.size).toBe(list.length)
})

test('без дублей ничего не меняется', () => {
  const list = [v(0, 'А 2000-2005'), v(0, 'Б 2006-2010'), v(1, 'В 2011-2015')]
  const { kept, indexMap } = dedupeVariants(list, slugsOf(list))
  expect(kept).toHaveLength(3)
  expect([...indexMap.values()]).toEqual([0, 1, 2])
})

test('сохранённые слаги соответствуют сохранённым кузовам', () => {
  const list = [
    v(0, 'Тойота РАВ4 XA10 1995-2000'),
    v(0, 'Тойота РАВ4 XA10 1995-2000'),
    v(0, 'Тойота РАВ4 XA20 2000-2006'),
  ]
  const { kept, keptSlugs } = dedupeVariants(list, slugsOf(list))
  expect(kept).toHaveLength(2)
  expect(keptSlugs).toEqual(['xa10-1995-2000', 'xa20-2000-2006'])
})

test('пустой список кузовов даёт пустой результат', () => {
  const { kept, indexMap } = dedupeVariants([], [])
  expect(kept).toEqual([])
  expect(indexMap.size).toBe(0)
})
