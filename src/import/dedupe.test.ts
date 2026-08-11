import { expect, test } from 'vitest'
import { dedupeFitments, dedupeVariants } from './dedupe'
import type { RawFitment, RawVariant } from './extract'

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

test('схлопывает одинаковые кузова одной модели', () => {
  const { kept } = dedupeVariants([
    v(0, 'Киа Соренто 1 BL 2006-2009'),
    v(0, 'Киа Соренто 1 BL 2006-2009'),
  ])
  expect(kept).toHaveLength(1)
})

test('одинаковые названия у РАЗНЫХ моделей не схлопываются', () => {
  const { kept } = dedupeVariants([v(0, 'Соренто 2006-2009'), v(1, 'Соренто 2006-2009')])
  expect(kept).toHaveLength(2)
})

test('схлопывает названия, дающие одинаковый слаг', () => {
  // приставка срезается, разделители схлопываются — слаг выходит один
  const { kept } = dedupeVariants([
    v(0, 'фаркопы для Киа Соренто 2006-2009'),
    v(0, 'Киа  Соренто  2006-2009'),
  ])
  expect(kept).toHaveLength(1)
})

test('карта соответствия переводит старые индексы на оставшийся кузов', () => {
  const { indexMap } = dedupeVariants([
    v(0, 'Соренто 2006-2009'),
    v(0, 'Соренто 2006-2009'),
    v(0, 'Спортейдж 2010-2015'),
  ])
  expect(indexMap.get(0)).toBe(0)
  expect(indexMap.get(1)).toBe(0)
  expect(indexMap.get(2)).toBe(1)
})

test('карта покрывает все входные индексы', () => {
  const list = [v(0, 'А 2000-2005'), v(0, 'А 2000-2005'), v(1, 'Б 2010-2015')]
  const { indexMap } = dedupeVariants(list)
  expect(indexMap.size).toBe(list.length)
})

test('без дублей ничего не меняется', () => {
  const list = [v(0, 'А 2000-2005'), v(0, 'Б 2006-2010'), v(1, 'В 2011-2015')]
  const { kept, indexMap } = dedupeVariants(list)
  expect(kept).toHaveLength(3)
  expect([...indexMap.values()]).toEqual([0, 1, 2])
})

test('пустой список кузовов даёт пустой результат', () => {
  const { kept, indexMap } = dedupeVariants([])
  expect(kept).toEqual([])
  expect(indexMap.size).toBe(0)
})
