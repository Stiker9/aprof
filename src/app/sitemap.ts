import type { MetadataRoute } from 'next'
import { listAllProductSlugs, listAllVariantPaths, listBrands, listModels } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

/**
 * Карта сайта строится из базы, а не пишется руками.
 *
 * Страниц больше восьми тысяч, и любая ручная поддержка разойдётся
 * с реальностью на первом же обновлении каталога.
 *
 * Одним файлом: предел формата — 50 000 адресов и 50 МБ, наши 8 238
 * помещаются с запасом. Дробить понадобится, только если каталог
 * вырастет в шесть раз.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb()
  const brands = await listBrands(db)

  const entries: MetadataRoute.Sitemap = [
    { url: absolute(urls.home()), priority: 1 },
    { url: absolute(urls.catalog()), priority: 0.9 },
  ]

  for (const brand of brands) {
    entries.push({ url: absolute(urls.brand(brand.slug)), priority: 0.8 })
    const models = await listModels(db, brand.slug)
    for (const model of models) {
      entries.push({ url: absolute(urls.model(brand.slug, model.slug)), priority: 0.7 })
    }
  }

  for (const path of await listAllVariantPaths(db)) {
    entries.push({
      url: absolute(urls.variant(path.brand, path.model, path.variant)),
      priority: 0.9,
    })
  }

  for (const slug of await listAllProductSlugs(db)) {
    entries.push({ url: absolute(urls.product(slug)), priority: 0.6 })
  }

  return entries
}
