import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatCount } from '@/catalog/format'
import { getBrand, listBrands, listModels } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { Breadcrumbs } from '@/components/breadcrumbs'
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
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: urls.home() },
          { label: 'Фаркопы', href: urls.catalog() },
          { label: found.name },
        ]}
      />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Фаркопы на {found.name}
      </h1>
      <p className="mt-3 text-ink-muted">
        {formatCount(models.length, 'модель', 'модели', 'моделей')} ·{' '}
        {formatCount(found.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((model) => (
          <Link
            key={model.slug}
            href={urls.model(brand, model.slug)}
            className="rounded-[var(--radius-card)] border border-line bg-surface p-5 hover:border-accent"
          >
            <span className="block text-ink">{model.name}</span>
            <span className="text-xs text-ink-muted">
              {formatCount(model.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
