import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatCount } from '@/catalog/format'
import { getBrand, listBrands, listModels } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell, CatalogTile } from '@/components/catalog/shell'
import { getDb } from '@/db/client'

interface Params {
  params: Promise<{ brand: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  const brands = await listBrands(db)
  return brands.map((b) => ({ brand: b.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { brand } = await params
  const db = await getDb()
  const found = await getBrand(db, brand)
  if (!found) return {}

  return {
    title: `Фаркопы на ${found.name} — купить с установкой`,
    description: `${formatCount(found.productCount, 'фаркоп', 'фаркопа', 'фаркопов')} на ${found.name} для ${formatCount(found.modelCount, 'модели', 'моделей', 'моделей')}. Подбор по кузову и году выпуска.`,
    alternates: { canonical: absolute(urls.brand(brand)) },
  }
}

export default async function BrandPage({ params }: Params) {
  const { brand } = await params
  const db = await getDb()
  const found = await getBrand(db, brand)
  if (!found) notFound()

  const models = await listModels(db, brand)

  return (
    <CatalogShell
      picker={{ brand: found.name }}
      crumbs={[
        { label: 'Главная', href: urls.home() },
        { label: 'Фаркопы', href: urls.catalog() },
        { label: found.name },
      ]}
      title={`Фаркопы на ${found.name}`}
      summary={`${formatCount(models.length, 'модель', 'модели', 'моделей')} · ${formatCount(found.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}`}
    >
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((model) => (
          <CatalogTile
            key={model.slug}
            href={urls.model(brand, model.slug)}
            title={model.name}
            count={formatCount(model.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
          />
        ))}
      </div>
    </CatalogShell>
  )
}
