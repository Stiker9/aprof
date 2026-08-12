import { beforeAll, expect, test } from 'vitest'
import { createTestDb } from '../db/test-helpers'
import { recalculateCounters } from '../import/counters'
import { importCatalog } from '../import/run'
import {
  getBrand,
  getProduct,
  getVariant,
  listAllProductSlugs,
  listAllVariantPaths,
  listBrands,
  listModels,
  listProductsForVariant,
  listVariants,
  listVariantsForProduct,
} from './queries'

const FIXTURE = `<script id="catalog-data" type="application/json">{
"brands":[["b:t","Toyota","u"],["b:c","Chery","u"]],
"models":[["m:1",0,"RAV4","u"],["m:2",1,"Tiggo","u"]],
"variants":[
  ["v:1",0,"фаркопы для Тойота РАВ4 XA10 1995-2000","u",0],
  ["v:2",0,"фаркопы для Тойота РАВ4 XA20 2000-2006","u",0],
  ["v:3",1,"фаркопы для Чери Тигго 2020-","u",0]
],
"products":[
  ["galia::t030a","T030A","GALIA","Словакия","Оцинкованный фаркоп",15990,"сегодня","3 шт Сегодня","u","A",1750,75,13.25,"not_required",false,["https://x/1.jpg"],[["https://x/1.pdf","Инструкция"]]],
  ["steinhof::t185","T-185","Steinhof","Польша","Съёмный",20990,"1-6 Мес","1 шт 1-6 Мес","u","F",1750,75,18,"required","unknown",[],[]]
],
"fitments":[
  [0,0,0,0,15990,"сегодня","u","u",1],
  [0,0,1,0,15990,"сегодня","u","u",1],
  [0,0,0,1,20990,"1-6 Мес","u","u",1]
]}</script>`

let db: Awaited<ReturnType<typeof createTestDb>>

beforeAll(async () => {
  db = await createTestDb()
  await importCatalog(FIXTURE, db)
  await recalculateCounters(db)
})

test('список марок содержит только публикуемые', async () => {
  const brands = await listBrands(db)
  expect(brands.map((b) => b.slug)).toEqual(['toyota'])
})

test('марка отдаёт счётчики', async () => {
  const brand = await getBrand(db, 'toyota')
  expect(brand?.name).toBe('Toyota')
  expect(brand?.productCount).toBe(2)
})

test('несуществующая марка даёт null', async () => {
  expect(await getBrand(db, 'nissan')).toBeNull()
})

test('скрытая марка не отдаётся', async () => {
  expect(await getBrand(db, 'chery')).toBeNull()
})

test('модели марки', async () => {
  const models = await listModels(db, 'toyota')
  expect(models.map((m) => m.slug)).toEqual(['rav4'])
  expect(models[0].variantCount).toBe(2)
})

test('кузова модели с разобранными годами', async () => {
  const variants = await listVariants(db, 'toyota', 'rav4')
  expect(variants).toHaveLength(2)
  const xa10 = variants.find((v) => v.generation === 'XA10')
  expect(xa10?.yearFrom).toBe(1995)
  expect(xa10?.yearTo).toBe(2000)
  expect(xa10?.hasOwnPage).toBe(true)
})

test('кузов по слагу', async () => {
  const variants = await listVariants(db, 'toyota', 'rav4')
  const variant = await getVariant(db, 'toyota', 'rav4', variants[0].slug)
  expect(variant?.slug).toBe(variants[0].slug)
})

test('товары кузова отсортированы по цене', async () => {
  const variants = await listVariants(db, 'toyota', 'rav4')
  const xa10 = variants.find((v) => v.generation === 'XA10')!
  const products = await listProductsForVariant(db, xa10.slug, 'toyota', 'rav4')
  expect(products.map((p) => p.article)).toEqual(['T030A', 'T-185'])
})

test('товар отдаёт характеристики и документы', async () => {
  const product = await getProduct(db, 't030a')
  expect(product?.manufacturer).toBe('GALIA')
  expect(product?.country).toBe('Словакия')
  expect(product?.ballType).toBe('A')
  expect(product?.inStock).toBe(true)
  expect(product?.documents).toEqual([{ url: 'https://x/1.pdf', label: 'Инструкция' }])
})

test('неизвестная электрика отдаётся как null', async () => {
  const product = await getProduct(db, 't-185')
  expect(product?.electricsIncluded).toBeNull()
})

test('машины, к которым подходит товар', async () => {
  const fits = await listVariantsForProduct(db, 't030a')
  expect(fits).toHaveLength(2)
  expect(fits[0].brand).toBe('Toyota')
  expect(fits[0].model).toBe('RAV4')
})

test('пути всех кузовов со своими страницами', async () => {
  const paths = await listAllVariantPaths(db)
  expect(paths).toHaveLength(2)
  expect(paths[0].brand).toBe('toyota')
})

test('слаги всех товаров', async () => {
  const slugs = await listAllProductSlugs(db)
  expect(slugs.sort()).toEqual(['t-185', 't030a'])
})
