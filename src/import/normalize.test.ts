import { expect, test } from 'vitest'
import {
  cleanVariantName,
  normalizeManufacturer,
  parseGeneration,
  parseYears,
  slugify,
  slugifyArticle,
} from './normalize'

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

test('slugify бросает ошибку, если после очистки не осталось символов', () => {
  expect(() => slugify('')).toThrow()
  expect(() => slugify('«»')).toThrow()
  expect(() => slugify('---')).toThrow()
  expect(() => slugify('!!!')).toThrow()
})

test('slugifyArticle различает точку и дефис как разделитель артикула', () => {
  expect(slugifyArticle('J.069')).not.toBe(slugifyArticle('J-069'))
  expect(slugifyArticle('K.023')).not.toBe(slugifyArticle('K-023'))
  expect(slugifyArticle('K.069')).not.toBe(slugifyArticle('K-069'))
})

test('slugifyArticle работает как обычно для артикулов без точки', () => {
  expect(slugifyArticle('T030A')).toBe('t030a')
})

test('slugifyArticle наследует поведение slugify на строке без букв и цифр', () => {
  expect(() => slugifyArticle('...')).toThrow()
})

test('срезает приставку «фаркопы для»', () => {
  expect(cleanVariantName('фаркопы для Тойота РАВ4 XA10 1995-2000')).toBe(
    'Тойота РАВ4 XA10 1995-2000',
  )
  expect(cleanVariantName('Фаркопы для Ауди А6 1997-2004')).toBe('Ауди А6 1997-2004')
})

test('не трогает названия без приставки', () => {
  expect(cleanVariantName('Giulia')).toBe('Giulia')
  expect(cleanVariantName('ZDX')).toBe('ZDX')
})

test('вытаскивает диапазон годов', () => {
  expect(parseYears('Тойота РАВ4 XA10 1995-2000')).toEqual({ from: 1995, to: 2000 })
  expect(parseYears('Тойота РАВ4 2025-')).toEqual({ from: 2025, to: null })
})

test('возвращает пустые годы, когда их нет в названии', () => {
  expect(parseYears('Giulia')).toEqual({ from: null, to: null })
  expect(parseYears('147')).toEqual({ from: null, to: null })
})

test('вытаскивает код поколения латиницей', () => {
  expect(parseGeneration('Тойота РАВ4 XA10 1995-2000', 'RAV4')).toBe('XA10')
  expect(parseGeneration('БМВ Х5 F15 2013-2018', 'X5')).toBe('F15')
  expect(parseGeneration('Тойота Королла E120 2000-2007', 'Corolla')).toBe('E120')
})

test('возвращает null, когда кода поколения нет', () => {
  expect(parseGeneration('Ауди А6 1997-2004', 'A6')).toBeNull()
  expect(parseGeneration('Giulia', 'Giulia')).toBeNull()
  expect(parseGeneration('147', '147')).toBeNull()
})

test('возвращает null, когда единственный латинский токен совпадает с именем модели', () => {
  expect(parseGeneration('Volvo S60 2000-2009', 'S60')).toBeNull()
  expect(parseGeneration('Infiniti QX50 2013-2017', 'QX50')).toBeNull()
})

test('вытаскивает код поколения, когда он отличается от модели', () => {
  expect(parseGeneration('Тойота РАВ4 XA10 1995-2000', 'RAV4')).toBe('XA10')
  expect(parseGeneration('БМВ Х5 F15 2013-2018', 'X5')).toBe('F15')
})

test('возвращает null для названия без годов, совпадающего с моделью', () => {
  expect(parseGeneration('Giulia', 'Giulia')).toBeNull()
})

test('сравнивает со всеми словами составного имени модели, а не с именем целиком', () => {
  expect(parseGeneration('Ауди Q3 Sportback 2019-', 'Q3 Sportback')).toBeNull()
  expect(parseGeneration('Ауди A6 e-tron 2024-', 'A6 e-tron')).toBeNull()
  expect(parseGeneration('Вольво S60 Cross Country 2015-2018', 'S60 Cross Country')).toBeNull()
})

test('доводка сравнения по словам не ломает рабочий случай с настоящим кодом поколения', () => {
  expect(parseGeneration('Тойота РАВ4 XA10 1995-2000', 'RAV4')).toBe('XA10')
})
