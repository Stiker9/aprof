import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { brands, fitments, manufacturers, models, products, variants } from './schema'

test('схема содержит все шесть таблиц с ключевыми полями', () => {
  expect(manufacturers.slug).toBeDefined()
  expect(brands.slug).toBeDefined()
  expect(brands.isPublished).toBeDefined()
  expect(models.brandId).toBeDefined()
  expect(variants.modelId).toBeDefined()
  expect(variants.hasOwnPage).toBeDefined()
  expect(products.article).toBeDefined()
  expect(products.bumperCut).toBeDefined()
  expect(fitments.productId).toBeDefined()
  expect(fitments.variantId).toBeDefined()
})

/**
 * Поднимает PGlite в памяти и применяет единственную SQL-миграцию из
 * drizzle/. Файл ищется по маске (readdirSync), а не по точному имени —
 * имя сгенерировано drizzle-kit случайным образом и может смениться.
 */
async function createTestDb() {
  const drizzleDir = path.resolve(__dirname, '../../drizzle')
  const migrationFile = readdirSync(drizzleDir).find((f) => f.endsWith('.sql'))
  if (!migrationFile) throw new Error('В drizzle/ не найден файл миграции .sql')
  const migration = readFileSync(path.join(drizzleDir, migrationFile), 'utf8')

  const client = new PGlite()
  for (const stmt of migration.split('--> statement-breakpoint')) {
    if (stmt.trim()) await client.exec(stmt)
  }
  return drizzle(client, { schema: { brands, fitments, manufacturers, models, products, variants } })
}

test('повторная вставка одинаковой пары (product_id, variant_id) в fitments отклоняется', async () => {
  const db = await createTestDb()

  const [manufacturer] = await db.insert(manufacturers).values({ slug: 'steinhof', name: 'Steinhof' }).returning()
  const [brand] = await db.insert(brands).values({ slug: 'toyota', name: 'Toyota' }).returning()
  const [model] = await db.insert(models).values({ brandId: brand.id, slug: 'rav4', name: 'RAV4' }).returning()
  const [variant] = await db
    .insert(variants)
    .values({ modelId: model.id, slug: 'xa10', name: 'RAV4 XA10' })
    .returning()
  const [product] = await db
    .insert(products)
    .values({
      slug: 'farkop-1',
      article: 'ART-1',
      manufacturerId: manufacturer.id,
      description: 'Фаркоп',
      sourcePrice: 1000,
    })
    .returning()

  await db.insert(fitments).values({ productId: product.id, variantId: variant.id })

  await expect(db.insert(fitments).values({ productId: product.id, variantId: variant.id })).rejects.toThrow()
})

test('вставка fitments с несуществующим product_id отклоняется внешним ключом', async () => {
  const db = await createTestDb()

  const [brand] = await db.insert(brands).values({ slug: 'toyota', name: 'Toyota' }).returning()
  const [model] = await db.insert(models).values({ brandId: brand.id, slug: 'rav4', name: 'RAV4' }).returning()
  const [variant] = await db
    .insert(variants)
    .values({ modelId: model.id, slug: 'xa10', name: 'RAV4 XA10' })
    .returning()

  await expect(
    db.insert(fitments).values({ productId: 999999, variantId: variant.id }),
  ).rejects.toThrow()
})
