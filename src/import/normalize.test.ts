import { expect, test } from 'vitest'
import { normalizeManufacturer, slugify } from './normalize'

test('схлопывает разный регистр в одно имя', () => {
  expect(normalizeManufacturer('Oris')).toBe(normalizeManufacturer('ORIS'))
  expect(normalizeManufacturer('AvtoS')).toBe(normalizeManufacturer('AVTOS'))
  expect(normalizeManufacturer('Berg')).toBe(normalizeManufacturer('BERG'))
  expect(normalizeManufacturer('Motodor')).toBe(normalizeManufacturer('MOTODOR'))
  expect(normalizeManufacturer('Лидер-плюс')).toBe(normalizeManufacturer('ЛИДЕР-ПЛЮС'))
})

test('склеивает ТСС кириллицей и TCC латиницей', () => {
  expect(normalizeManufacturer('ТСС')).toBe(normalizeManufacturer('TCC'))
})

test('выбирает наиболее читаемое написание как каноническое', () => {
  expect(normalizeManufacturer('ORIS')).toBe('Oris')
  expect(normalizeManufacturer('AVTOS')).toBe('AvtoS')
  expect(normalizeManufacturer('ЛИДЕР-ПЛЮС')).toBe('Лидер-плюс')
  expect(normalizeManufacturer('TCC')).toBe('ТСС')
})

test('не трогает производителей без дублей', () => {
  expect(normalizeManufacturer('Steinhof')).toBe('Steinhof')
  expect(normalizeManufacturer('GALIA')).toBe('GALIA')
})

test('slugify переводит кириллицу в латиницу', () => {
  expect(slugify('Лидер-плюс')).toBe('lider-plyus')
  expect(slugify('ТСС')).toBe('tss')
  expect(slugify('Land Cruiser Prado')).toBe('land-cruiser-prado')
  expect(slugify('XA10 · 1995–2000')).toBe('xa10-1995-2000')
})

test('slugify не оставляет пустых строк и двойных дефисов', () => {
  expect(slugify('  A --- B  ')).toBe('a-b')
})
