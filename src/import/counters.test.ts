import { eq } from 'drizzle-orm'
import { beforeAll, expect, test } from 'vitest'
import * as schema from '../db/schema'
import { createTestDb } from '../db/test-helpers'
import { recalculateCounters } from './counters'
import { importCatalog } from './run'

/**
 * Три марки на три разных случая:
 * Alfa  — модель с ОДНИМ кузовом и товаром → кузов без своей страницы
 * Bmw   — модель с ДВУМЯ кузовами и товарами → оба кузова со страницами
 * Chery — модель без товаров → не публикуется вообще
 */
const FIXTURE = `<script id="catalog-data" type="application/json">{
"brands":[["b:a","Alfa","u"],["b:b","Bmw","u"],["b:c","Chery","u"]],
"models":[["m:a",0,"Giulia","u"],["m:b",1,"X5","u"],["m:c",2,"Tiggo","u"]],
"variants":[
  ["v:1",0,"Giulia 2016-2020","u",0],
  ["v:2",1,"X5 E70 2007-2013","u",0],
  ["v:3",1,"X5 F15 2013-2018","u",0],
  ["v:4",2,"Tiggo 2020-","u",0]
],
"products":[
  ["a::p1","P1","GALIA","Словакия","Опис",1000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]],
  ["a::p2","P2","GALIA","Словакия","Опис",2000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]],
  ["a::p3","P3","GALIA","Словакия","Опис",3000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]]
],
"fitments":[
  [0,0,0,0,1000,"сегодня","u","u",1],
  [1,1,1,1,2000,"сегодня","u","u",1],
  [1,1,2,2,3000,"сегодня","u","u",1]
]}</script>`

let db: Awaited<ReturnType<typeof createTestDb>>
let stats: Awaited<ReturnType<typeof recalculateCounters>>

beforeAll(async () => {
  db = await createTestDb()
  await importCatalog(FIXTURE, db)
  stats = await recalculateCounters(db)
})

test('марка без товаров не публикуется', async () => {
  const [row] = await db.select().from(schema.brands).where(eq(schema.brands.name, 'Chery'))
  expect(row.isPublished).toBe(false)
  expect(row.productCount).toBe(0)
})

test('марка с товарами публикуется и знает их количество', async () => {
  const [row] = await db.select().from(schema.brands).where(eq(schema.brands.name, 'Bmw'))
  expect(row.isPublished).toBe(true)
  expect(row.productCount).toBe(2)
})

test('единственный кузов модели не получает своей страницы', async () => {
  const [row] = await db
    .select()
    .from(schema.variants)
    .where(eq(schema.variants.slug, 'giulia-2016-2020'))
  expect(row.isPublished).toBe(true)
  expect(row.hasOwnPage).toBe(false)
})

test('кузова модели с несколькими поколениями получают страницы', async () => {
  const rows = await db.select().from(schema.variants).where(eq(schema.variants.modelId, 2))
  const published = rows.filter((v) => v.isPublished)
  expect(published).toHaveLength(2)
  expect(published.every((v) => v.hasOwnPage)).toBe(true)
})

test('кузов без товаров не публикуется и страницы не получает', async () => {
  const [row] = await db.select().from(schema.variants).where(eq(schema.variants.slug, 'tiggo-2020'))
  expect(row.isPublished).toBe(false)
  expect(row.hasOwnPage).toBe(false)
})

test('модель без товаров не публикуется', async () => {
  const [row] = await db.select().from(schema.models).where(eq(schema.models.name, 'Tiggo'))
  expect(row.isPublished).toBe(false)
})

test('счётчик кузовов у модели считает только публикуемые', async () => {
  const [row] = await db.select().from(schema.models).where(eq(schema.models.name, 'X5'))
  expect(row.variantCount).toBe(2)
  expect(row.productCount).toBe(2)
})

test('итоговая сводка считает опубликованное', () => {
  expect(stats.publishedBrands).toBe(2)
  expect(stats.publishedModels).toBe(2)
  expect(stats.publishedVariants).toBe(3)
  expect(stats.variantsWithOwnPage).toBe(2)
})
