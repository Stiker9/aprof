import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatCount, formatYears } from '@/catalog/format'
import {
  getBrand,
  getModel,
  listBrands,
  listModels,
  listProductsForVariant,
  listVariants,
} from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { getDb } from '@/db/client'

interface Params {
  params: Promise<{ brand: string; model: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  const brands = await listBrands(db)
  const params: { brand: string; model: string }[] = []
  for (const brand of brands) {
    const models = await listModels(db, brand.slug)
    for (const model of models) {
      params.push({ brand: brand.slug, model: model.slug })
    }
  }
  return params
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { brand, model } = await params
  const db = await getDb()
  const [foundBrand, foundModel] = await Promise.all([
    getBrand(db, brand),
    getModel(db, brand, model),
  ])
  if (!foundBrand || !foundModel) return {}

  return {
    title: `Фаркопы на ${foundBrand.name} ${foundModel.name} — купить с установкой`,
    description: `${formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')} на ${foundBrand.name} ${foundModel.name}. Подбор по поколению и году выпуска.`,
    alternates: { canonical: absolute(urls.model(brand, model)) },
  }
}

export default async function ModelPage({ params }: Params) {
  const { brand, model } = await params
  const db = await getDb()
  const [foundBrand, foundModel] = await Promise.all([
    getBrand(db, brand),
    getModel(db, brand, model),
  ])
  if (!foundBrand || !foundModel) notFound()

  const variants = await listVariants(db, brand, model)

  /**
   * Если у модели единственный кузов, отдельной страницы у него нет —
   * она дублировала бы эту. Поэтому товары показываем прямо здесь.
   */
  const single = variants.length === 1 && !variants[0].hasOwnPage
  const products = single ? await listProductsForVariant(db, variants[0].slug, brand, model) : []

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: urls.home() },
          { label: 'Фаркопы', href: urls.catalog() },
          { label: foundBrand.name, href: urls.brand(brand) },
          { label: foundModel.name },
        ]}
      />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Фаркопы на {foundBrand.name} {foundModel.name}
      </h1>
      <p className="mt-3 text-ink-muted">
        {single
          ? formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')
          : `${formatCount(variants.length, 'поколение', 'поколения', 'поколений')} · ${formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}`}
      </p>

      {single ? (
        <div className="mt-8 space-y-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant) => (
            <Link
              key={variant.slug}
              href={urls.variant(brand, model, variant.slug)}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-5 hover:border-accent"
            >
              <span className="block text-lg text-ink">
                {variant.generation ?? formatYears(variant.yearFrom, variant.yearTo) ?? foundModel.name}
              </span>
              <span className="block text-sm text-ink-muted">
                {variant.generation ? formatYears(variant.yearFrom, variant.yearTo) : ''}
              </span>
              <span className="mt-2 block text-xs text-ink-dim">
                {formatCount(variant.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
