import { expect, test } from 'vitest'
import { rowsOf } from './client'

test('возвращает массив как есть', () => {
  const input = [{ id: 1 }, { id: 2 }]
  expect(rowsOf(input)).toBe(input)
})

test('извлекает rows из объекта в формате PGlite', () => {
  const input = { rows: [{ id: 1 }], fields: [], affectedRows: 0 }
  expect(rowsOf(input)).toEqual([{ id: 1 }])
})

test('возвращает пустой массив для объекта без поля rows', () => {
  expect(rowsOf({ affectedRows: 1 })).toEqual([])
})

test('возвращает пустой массив для null', () => {
  expect(rowsOf(null)).toEqual([])
})

test('возвращает пустой массив для undefined', () => {
  expect(rowsOf(undefined)).toEqual([])
})

test('возвращает пустой массив на входе как пустой массив', () => {
  expect(rowsOf([])).toEqual([])
})
