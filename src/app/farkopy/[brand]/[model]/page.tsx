import type { Metadata } from 'next'
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
import { CatalogShell, CatalogTile } from '@/components/catalog/shell'
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
    <CatalogShell
      picker={{ brand: foundBrand.name, model: foundModel.name }}
      crumbs={[
        { label: 'Главная', href: urls.home() },
        { label: 'Фаркопы', href: urls.catalog() },
        { label: foundBrand.name, href: urls.brand(brand) },
        { label: foundModel.name },
      ]}
      title={`Фаркопы на ${foundBrand.name} ${foundModel.name}`}
      summary={
        single
          ? formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')
          : `${formatCount(variants.length, 'поколение', 'поколения', 'поколений')} · ${formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}`
      }
    >
      {single ? (
        <div className="mt-10 space-y-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant) => (
            <CatalogTile
              key={variant.slug}
              href={urls.variant(brand, model, variant.slug)}
              title={variant.generation ?? formatYears(variant.yearFrom, variant.yearTo)}
              note={variant.generation ? formatYears(variant.yearFrom, variant.yearTo) : undefined}
              count={formatCount(variant.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
            />
          ))}
        </div>
      )}
    </CatalogShell>
  )
}
