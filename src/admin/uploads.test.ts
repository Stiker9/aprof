import { expect, test } from 'vitest'
import { slugify } from './uploads'

test('русское название превращается в латинское имя файла', () => {
  expect(slugify('Лада Ларгус')).toBe('lada-largus')
  expect(slugify('Шар и посадочный квадрат')).toBe('shar-i-posadochnyy-kvadrat')
})

test('латиница и цифры остаются как есть', () => {
  expect(slugify('BMW X6')).toBe('bmw-x6')
  expect(slugify('Chery Tiggo 8 Pro Max')).toBe('chery-tiggo-8-pro-max')
})

test('знаки препинания не попадают в имя файла', () => {
  // Косая черта и точки в имени — это выход из папки и подмена
  // расширения. До диска такое доходить не должно.
  expect(slugify('../../etc/passwd')).toBe('etc-passwd')
  expect(slugify('фото 1.jpg')).toBe('foto-1-jpg')
})

test('пустое и неподдающееся даёт пустую строку, а не мусор', () => {
  expect(slugify('')).toBe('')
  expect(slugify('中文')).toBe('')
  expect(slugify('---')).toBe('')
})

test('длинное имя обрезается', () => {
  expect(slugify('а'.repeat(100)).length).toBeLessThanOrEqual(40)
})
