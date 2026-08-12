import { sql } from 'drizzle-orm'
import { beforeEach, expect, test } from 'vitest'
import { createTestDb } from '../db/test-helpers'
import { recalculateCounters } from './counters'
import { importCatalog } from './run'
import { verifyIntegrity } from './verify'

const FIXTURE = `<script id="catalog-data" type="application/json">{
"brands":[["b:a","Alfa","u"],["b:b","Bmw","u"]],
"models":[["m:a",0,"Giulia","u"],["m:b",1,"X5","u"]],
"variants":[
  ["v:1",0,"Giulia 2016-2020","u",0],
  ["v:2",1,"X5 E70 2007-2013","u",0],
  ["v:3",1,"X5 F15 2013-2018","u",0]
],
"products":[
  ["a::p1","P1","GALIA","Словакия","Опис",1000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]],
  ["a::p2","P2","GALIA","Словакия","Опис",2000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]]
],
"fitments":[
  [0,0,0,0,1000,"сегодня","u","u",1],
  [1,1,1,1,2000,"сегодня","u","u",1],
  [1,1,2,1,2000,"сегодня","u","u",1]
]}</script>`

let db: Awaited<ReturnType<typeof createTestDb>>

beforeEach(async () => {
  db = await createTestDb()
  await importCatalog(FIXTURE, db)
  await recalculateCounters(db)
})

test('на здоровых данных нарушений нет', async () => {
  expect(await verifyIntegrity(db)).toEqual([])
})

test('ловит опубликованный кузов без товаров', async () => {
  await db.execute(sql`UPDATE variants SET is_published = TRUE, product_count = 0 WHERE id = 1`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain('Опубликованные кузова без товаров')
})

test('ловит скрытый кузов, у которого есть товары', async () => {
  await db.execute(sql`UPDATE variants SET is_published = FALSE WHERE id = 1`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain('Скрытые кузова, у которых есть товары')
})

test('ловит кузов со своей страницей, но не опубликованный', async () => {
  await db.execute(sql`UPDATE variants SET has_own_page = TRUE, is_published = FALSE, product_count = 0 WHERE id = 1`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain(
    'Кузова со своей страницей, но не опубликованные',
  )
})

test('ловит опубликованную марку без товаров', async () => {
  await db.execute(sql`UPDATE brands SET is_published = TRUE, product_count = 0`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain('Опубликованные марки без товаров')
})

test('ловит опубликованную модель без товаров', async () => {
  await db.execute(sql`UPDATE models SET is_published = TRUE, product_count = 0`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain('Опубликованные модели без товаров')
})

test('ловит товар, не привязанный ни к одному кузову', async () => {
  await db.execute(sql`DELETE FROM fitments WHERE product_id = 1`)
  await recalculateCounters(db)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain('Товары, не привязанные ни к одному кузову')
})

test('ловит разошедшийся счётчик кузова', async () => {
  await db.execute(sql`UPDATE variants SET product_count = 99 WHERE id = 1`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain(
    'Кузова, у которых счётчик разошёлся со связками',
  )
})

test('ловит товар без слага', async () => {
  await db.execute(sql`UPDATE products SET slug = '' WHERE id = 1`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain('Товары без слага')
})

test('ловит кузов без слага', async () => {
  await db.execute(sql`UPDATE variants SET slug = '' WHERE id = 1`)
  const problems = await verifyIntegrity(db)
  expect(problems.map((p) => p.check)).toContain('Кузова без слага')
})

test('сообщает количество нарушений, а не только факт', async () => {
  await db.execute(sql`UPDATE variants SET product_count = 99`)
  const problems = await verifyIntegrity(db)
  const found = problems.find((p) => p.check === 'Кузова, у которых счётчик разошёлся со связками')
  expect(found?.count).toBe(3)
})

test('повторный пересчёт снимает флаг с кузова, потерявшего связки', async () => {
  await db.execute(sql`DELETE FROM fitments WHERE variant_id = 1`)
  await recalculateCounters(db)
  const problems = await verifyIntegrity(db)
  // товар остался без связок — это ожидаемое нарушение, а вот кузов
  // должен был сняться с публикации, а не остаться со старым счётчиком
  expect(problems.map((p) => p.check)).not.toContain('Опубликованные кузова без товаров')
  expect(problems.map((p) => p.check)).not.toContain(
    'Кузова, у которых счётчик разошёлся со связками',
  )
})
