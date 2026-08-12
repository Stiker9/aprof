import { beforeAll, expect, test } from 'vitest'
import * as schema from '../db/schema'
import { createTestDb } from '../db/test-helpers'
import { importCatalog } from './run'

/**
 * Набор данных подобран так, чтобы задеть все нетривиальные случаи:
 * два написания одного производителя, дубль связки, дубль кузова,
 * приставка в названии, кузов без годов.
 */
const FIXTURE = `<script id="catalog-data" type="application/json">{
"brands":[["b:a","Acura","ua"],["b:t","Toyota","ut"]],
"models":[["m:1",0,"MDX","u1"],["m:2",1,"RAV4","u2"]],
"variants":[
  ["v:1",0,"фаркопы для Акура МДХ 2006-2014","u",0],
  ["v:2",1,"фаркопы для Тойота РАВ4 XA10 1995-2000","u",0],
  ["v:3",1,"фаркопы для Тойота РАВ4 XA10 1995-2000","u",0]
],
"products":[
  ["oris::x1","X1","ORIS","Словакия","Оцинкованный",1000,"сегодня","1 шт Сегодня","u","A",1000,50,10,"not_required",false,["https://x/1.jpg"],[["https://x/1.pdf","Инструкция"]]],
  ["oris::x2","X.2","Oris","Польша","Съёмный",2000,"1-6 Мес","1 шт 1-6 Мес","u","C",1500,75,12,"required","unknown",[],[]]
],
"fitments":[
  [0,0,0,0,1000,"сегодня","u","u",1],
  [0,0,0,0,1000,"сегодня","u","u",1],
  [1,1,1,1,2000,"1-6 Мес","u","u",1],
  [1,1,2,1,2000,"1-6 Мес","u","u",1]
]}</script>`

let stats: Awaited<ReturnType<typeof importCatalog>>
let db: Awaited<ReturnType<typeof createTestDb>>

beforeAll(async () => {
  db = await createTestDb()
  stats = await importCatalog(FIXTURE, db)
})

test('производители схлопнуты в одного', async () => {
  expect(stats.manufacturers).toBe(1)
  const rows = await db.select().from(schema.manufacturers)
  expect(rows[0].name).toBe('Oris')
})

test('дубли связок убраны', () => {
  // 4 записи: две одинаковые + две на дубль кузова, который тоже схлопнулся
  expect(stats.fitments).toBe(2)
})

test('дубль кузова схлопнут', () => {
  expect(stats.variants).toBe(2)
})

test('приставка из названия кузова срезана', async () => {
  const rows = await db.select().from(schema.variants)
  expect(rows.every((v) => !v.name.toLowerCase().startsWith('фаркопы для'))).toBe(true)
})

test('годы и поколение разобраны', async () => {
  const rows = await db.select().from(schema.variants)
  const rav = rows.find((v) => v.name.includes('РАВ4'))
  expect(rav?.yearFrom).toBe(1995)
  expect(rav?.yearTo).toBe(2000)
  expect(rav?.generation).toBe('XA10')
})

test('точка в артикуле не превращается в разделитель', async () => {
  const rows = await db.select().from(schema.products)
  const slugs = rows.map((p) => p.slug).sort()
  expect(slugs).toEqual(['x1', 'x2'])
})

test('наличие определяется по сроку отгрузки', async () => {
  const rows = await db.select().from(schema.products)
  expect(rows.find((p) => p.article === 'X1')?.inStock).toBe(true)
  expect(rows.find((p) => p.article === 'X.2')?.inStock).toBe(false)
})

test('неизвестная электрика записана как null, а не как false', async () => {
  const rows = await db.select().from(schema.products)
  expect(rows.find((p) => p.article === 'X1')?.electricsIncluded).toBe(false)
  expect(rows.find((p) => p.article === 'X.2')?.electricsIncluded).toBeNull()
})

test('фото и документы сохранены', async () => {
  const rows = await db.select().from(schema.products)
  const x1 = rows.find((p) => p.article === 'X1')
  expect(x1?.images).toEqual(['https://x/1.jpg'])
  expect(x1?.documents).toEqual([{ url: 'https://x/1.pdf', label: 'Инструкция' }])
})

test('связки указывают на сохранившийся кузов', async () => {
  const fitments = await db.select().from(schema.fitments)
  const variants = await db.select().from(schema.variants)
  const ids = new Set(variants.map((v) => v.id))
  expect(fitments.every((f) => ids.has(f.variantId))).toBe(true)
})

test('марки и модели записаны полностью', () => {
  expect(stats.brands).toBe(2)
  expect(stats.models).toBe(2)
  expect(stats.products).toBe(2)
})
