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

test('пустой массив на входе остаётся пустым', () => {
  expect(rowsOf([])).toEqual([])
})

test('пустой rows остаётся пустым', () => {
  expect(rowsOf({ rows: [], fields: [], affectedRows: 0 })).toEqual([])
})

test('бросает ошибку на объекте без поля rows', () => {
  expect(() => rowsOf({ affectedRows: 1 })).toThrow(/неизвестной формы/)
})

test('бросает ошибку, если rows не массив', () => {
  expect(() => rowsOf({ rows: 'нет' })).toThrow(/неизвестной формы/)
})

test('бросает ошибку на null', () => {
  expect(() => rowsOf(null)).toThrow(/неизвестной формы/)
})

test('бросает ошибку на undefined', () => {
  expect(() => rowsOf(undefined)).toThrow(/неизвестной формы/)
})
