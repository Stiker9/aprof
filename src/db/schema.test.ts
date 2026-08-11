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
