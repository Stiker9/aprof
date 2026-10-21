import type { Metadata } from 'next'
import { countProducts, listBrands, listModels } from '@/catalog/queries'
import { listInStockShowcase } from '@/catalog/showcase'
import { Blog } from '@/components/home/blog'
import { Brands } from '@/components/home/brands'
import { Categories } from '@/components/home/categories'
import { Contacts } from '@/components/home/contacts'
import { Faq } from '@/components/home/faq'
import { Hero } from '@/components/home/hero'
import { InStock } from '@/components/home/in-stock'
import { Numbers } from '@/components/home/numbers'
import { Promos } from '@/components/home/promos'
import { Steps } from '@/components/home/steps'
import { Why } from '@/components/home/why'
import { Works } from '@/components/home/works'
import { getDb } from '@/db/client'

/* Без canonical главная доступна и как /, и как /?utm=… — поисковик видел бы дубли. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const db = await getDb()
  // Число товаров считается отдельным запросом, а не суммой по маркам:
  // один фаркоп подходит к машинам разных марок, и сумма счётчиков
  // насчитывает 7 339 вместо 5 808.
  const [brands, totalProducts, showcase] = await Promise.all([
    listBrands(db),
    countProducts(db),
    listInStockShowcase(db, 4),
  ])

  /*
    Модели для строки «популярные модели» — по спросу, а не по
    наполненности каталога. Раньше брали самую наполненную модель у
    восьми крупных марок, и в строку попадали Opel Astra и Renault Megane,
    а Vesta, Haval и Chery, на которые сейчас ищут фаркопы чаще всего, —
    нет. Ссылки с главной — самые весомые внутренние, их стоит отдавать
    страницам, у которых есть спрос.

    Список — самые массовые кроссоверы и универсалы российского парка.
    Модель, которой нет в каталоге или у которой нет товаров, просто
    выпадает из строки, а не ведёт на пустую страницу.
  */
  const POPULAR: Array<[brand: string, model: string]> = [
    ['lada', 'vesta'],
    ['lada', 'largus'],
    ['lada', 'niva-legend'],
    ['haval', 'jolion'],
    ['haval', 'f7'],
    ['chery', 'tiggo-7-pro'],
    ['geely', 'monjaro'],
    ['kia', 'sportage'],
    ['hyundai', 'creta'],
    ['toyota', 'rav4'],
    ['toyota', 'land-cruiser-prado'],
    ['renault', 'duster'],
    ['skoda', 'kodiaq'],
    ['volkswagen', 'tiguan'],
    ['mitsubishi', 'outlander'],
    ['nissan', 'x-trail'],
  ]
  const popularBrandSlugs = [...new Set(POPULAR.map(([brand]) => brand))]
  const popularBrandModels = new Map(
    await Promise.all(
      popularBrandSlugs.map(async (slug) => [slug, await listModels(db, slug)] as const),
    ),
  )
  const popularModels = POPULAR.map(([brandSlug, modelSlug]) => {
    const brand = brands.find((b) => b.slug === brandSlug)
    const model = popularBrandModels.get(brandSlug)?.find((m) => m.slug === modelSlug)
    if (!brand || !model || model.productCount === 0) return null
    return { brandName: brand.name, brandSlug, name: model.name, slug: model.slug }
  }).filter((model): model is NonNullable<typeof model> => model !== null)

  return (
    // Секции идут встык: страница — сплошное полотно, а не стопка плиток
    <main className="flex flex-col">
      <Hero />
      <Numbers />
      <Brands brands={brands} totalBrands={brands.length} />
      <Categories productCount={totalProducts} brandCount={brands.length} models={popularModels} />
      {/* Витрина склада: единственное место на главной, где видна цена. */}
      <InStock items={showcase} />
      <Steps />
      <Promos />
      <Works />
      <Why />
      <Faq />
      <Blog />
      <Contacts />
    </main>
  )
}
