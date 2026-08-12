import { expect, test } from 'vitest'
import { formatCount, formatPrice, formatVariantLabel, formatYears, plural } from './format'

test('склонение по русским правилам', () => {
  expect(plural(1, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркоп')
  expect(plural(2, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркопа')
  expect(plural(5, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркопов')
  expect(plural(21, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркоп')
  expect(plural(0, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркопов')
})

test('склонение на числах, где ошибаются чаще всего', () => {
  // 11-14 всегда «многие», хотя оканчиваются на 1-4
  expect(plural(11, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(12, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(14, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(111, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(101, 'модель', 'модели', 'моделей')).toBe('модель')
})

test('число вместе со словом', () => {
  expect(formatCount(61, 'модель', 'модели', 'моделей')).toBe('61 модель')
  expect(formatCount(34, 'модель', 'модели', 'моделей')).toBe('34 модели')
  expect(formatCount(579, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('579 фаркопов')
})

test('цена с разделением разрядов', () => {
  expect(formatPrice(15990)).toBe('15 990 ₽')
  expect(formatPrice(4090)).toBe('4 090 ₽')
  expect(formatPrice(199990)).toBe('199 990 ₽')
})

test('годы выпуска', () => {
  expect(formatYears(1995, 2000)).toBe('1995–2000')
  expect(formatYears(2025, null)).toBe('2025 и новее')
  expect(formatYears(null, null)).toBe('')
})

test('подпись кузова собирается из латинских частей', () => {
  expect(formatVariantLabel('Toyota', 'RAV4', 'XA10', 1995, 2000)).toBe(
    'Toyota RAV4 XA10 1995–2000',
  )
})

test('подпись без кода поколения не оставляет двойных пробелов', () => {
  expect(formatVariantLabel('Audi', 'A6', null, 1997, 2004)).toBe('Audi A6 1997–2004')
})

test('подпись без годов обходится названием', () => {
  expect(formatVariantLabel('Alfa Romeo', 'Giulia', null, null, null)).toBe('Alfa Romeo Giulia')
})
